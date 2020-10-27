import orderBy from 'lodash/orderBy'
import { User, UserReference } from "@worldbrain/memex-common/lib/web-interface/types/users"
import { SharedAnnotation, SharedPageInfo, SharedAnnotationReference, SharedPageInfoReference } from "@worldbrain/memex-common/lib/content-sharing/types"
import { UILogic, UIEventHandler, executeUITask, UIMutation } from "../../../../../main-ui/classes/logic"
import { UITaskState } from "../../../../../main-ui/types"
import { PageDetailsEvent, PageDetailsDependencies } from "./types"
import { AnnotationConversationStates, AnnotationConversationState } from '../../../../content-conversations/ui/types'
import { getInitialAnnotationConversationStates } from '../../../../content-conversations/ui/utils'

export interface PageDetailsState {
    annotationLoadState: UITaskState
    annotations?: Array<SharedAnnotation & { reference: SharedAnnotationReference, linkId: string }> | null

    pageInfoLoadState: UITaskState
    pageInfoReference?: SharedPageInfoReference | null
    pageInfo?: SharedPageInfo | null

    creatorLoadState: UITaskState
    creator?: User | null
    creatorReference?: UserReference | null

    conversations: AnnotationConversationStates
    conversationReplySubmitState: UITaskState
}
type EventHandler<EventName extends keyof PageDetailsEvent> = UIEventHandler<PageDetailsState, PageDetailsEvent, EventName>

export default class PageDetailsLogic extends UILogic<PageDetailsState, PageDetailsEvent> {
    users: { [id: string]: Promise<User | null> } = {}

    constructor(private dependencies: PageDetailsDependencies) {
        super()
    }

    getInitialState(): PageDetailsState {
        return {
            creatorLoadState: 'pristine',
            annotationLoadState: 'pristine',
            pageInfoLoadState: 'pristine',

            conversations: {},
            conversationReplySubmitState: 'pristine',
        }
    }

    init: EventHandler<'init'> = async () => {
        const { storage, userManagement } = this.dependencies
        const pageInfoReference = storage.contentSharing.getSharedPageInfoReferenceFromLinkID(this.dependencies.pageID)
        let creatorReference: UserReference | null
        let pageInfo: SharedPageInfo | null
        await executeUITask<PageDetailsState>(this, 'pageInfoLoadState', async () => {
            const result = await storage.contentSharing.getPageInfo(pageInfoReference)
            creatorReference = result?.creatorReference ?? null
            pageInfo = result?.pageInfo ?? null

            return {
                mutation: {
                    pageInfo: { $set: pageInfo },
                    pageInfoReference: { $set: result.reference },
                    creatorReference: { $set: creatorReference },
                }
            }
        })
        await Promise.all([
            executeUITask<PageDetailsState>(this, 'annotationLoadState', async () => {
                if (!creatorReference || !pageInfo) {
                    return
                }

                const annotations = (await storage.contentSharing.getAnnotationsByCreatorAndPageUrl({
                    creatorReference,
                    normalizedPageUrl: pageInfo.normalizedUrl,
                })).map(annotation => ({
                    ...annotation,
                    linkId: storage.contentSharing.getSharedAnnotationLinkID(annotation.reference)
                }))
                return {
                    mutation: {
                        annotations: {
                            $set: orderBy(annotations, ['createdWhen', 'desc'])
                        },
                        conversations: {
                            $set: getInitialAnnotationConversationStates(
                                annotations,
                            )
                        }
                    }
                }
            }),
            executeUITask<PageDetailsState>(this, 'creatorLoadState', async () => {
                if (!creatorReference) {
                    return
                }

                return {
                    mutation: {
                        creator: {
                            $set: await userManagement.getUser(creatorReference),
                        }
                    }
                }
            })
        ])
    }

    toggleAnnotationReplies: EventHandler<'toggleAnnotationReplies'> = async ({ event, previousState }) => {
        const annotationId = this.dependencies.storage.contentSharing.getSharedAnnotationLinkID(event.annotationReference)
        const conversation = previousState.conversations[annotationId]

        this.emitMutation({ conversations: { [annotationId]: { expanded: { $set: !conversation.expanded } } } })
        if (conversation.loadState !== 'pristine') {
            return
        }

        await executeUITask<PageDetailsState>(this, taskState => ({
            conversations: { [annotationId]: { loadState: { $set: taskState } } }
        }), async () => {
            const replies = await this.dependencies.storage.contentConversations.getRepliesByAnnotation({
                annotationReference: event.annotationReference!,
            })
            return {
                mutation: {
                    conversations: {
                        [annotationId]: {
                            replies: {
                                $set: await Promise.all(replies.map(async reply => ({
                                    ...reply,
                                    user: await this._loadUser(reply.userReference)
                                })))
                            }
                        }
                    }
                }
            }
        })
    }

    initiateNewReplyToAnnotation: EventHandler<'initiateNewReplyToAnnotation'> = ({ event }) => {
        const annotationId = this.dependencies.storage.contentSharing.getSharedAnnotationLinkID(event.annotationReference)
        return {
            conversations: {
                [annotationId]: {
                    expanded: { $set: true },
                    newReply: { editing: { $set: true } }
                }
            }
        }
    }

    editNewReplyToAnnotation: EventHandler<'editNewReplyToAnnotation'> = ({ event }) => {
        const annotationId = this.dependencies.storage.contentSharing.getSharedAnnotationLinkID(event.annotationReference)
        return { conversations: { [annotationId]: { newReply: { content: { $set: event.content } } } } }
    }

    cancelNewReplyToAnnotation: EventHandler<'cancelNewReplyToAnnotation'> = ({ event }) => {
        const annotationId = this.dependencies.storage.contentSharing.getSharedAnnotationLinkID(event.annotationReference)
        return { conversations: { [annotationId]: { newReply: { editing: { $set: false } } } } }
    }

    confirmNewReplyToAnnotation: EventHandler<'confirmNewReplyToAnnotation'> = async ({ event, previousState }) => {
        const annotationId = this.dependencies.storage.contentSharing.getSharedAnnotationLinkID(event.annotationReference)
        const annotation = previousState.annotations!.find(annotation => annotation.linkId === annotationId)
        const conversation = previousState.conversations[annotationId]
        const user = await this.dependencies.services.auth.getCurrentUser()
        if (!annotation) {
            throw new Error(`Could not find annotation to sumbit reply to`)
        }
        if (!conversation) {
            throw new Error(`Could not find annotation to sumbit reply to`)
        }
        if (!user) {
            throw new Error(`Tried to submit a reply without being authenticated`)
        }

        const pageInfoReference = this.dependencies.storage.contentSharing.getSharedPageInfoReferenceFromLinkID(this.dependencies.pageID)
        await executeUITask<PageDetailsState>(this, 'conversationReplySubmitState', async () => {
            const result = await this.dependencies.services.contentConversations.submitReply({
                pageInfoReference: pageInfoReference,
                annotationReference: event.annotationReference,
                normalizedPageUrl: annotation.normalizedPageUrl,
                reply: { content: conversation.newReply.content }
            })
            if (result.status === 'not-authenticated') {
                return { status: 'pristine' }
            }
            this.emitMutation({
                conversations: {
                    [annotationId]: {
                        newReply: { $set: { editing: false, content: '' } },
                        replies: {
                            $push: [{
                                reference: result.replyReference,
                                reply: {
                                    createdWhen: Date.now(),
                                    normalizedPageUrl: annotation.normalizedPageUrl,
                                    content: conversation.newReply.content,
                                },
                                user: user,
                            }]
                        }
                    }
                }
            })
        })
    }

    async _loadUser(userReference: UserReference): Promise<User | null> {
        if (this.users[userReference.id]) {
            return this.users[userReference.id]
        }

        const user = this.dependencies.userManagement.getUser(userReference)
        this.users[userReference.id] = user
        return user
    }
}
