import orderBy from 'lodash/orderBy'
import { User, UserReference } from "@worldbrain/memex-common/lib/web-interface/types/users"
import { SharedAnnotation, SharedPageInfo, SharedAnnotationReference, SharedPageInfoReference } from "@worldbrain/memex-common/lib/content-sharing/types"
import { UILogic, UIEventHandler, executeUITask, UIMutation } from "../../../../../main-ui/classes/logic"
import { UITaskState } from "../../../../../main-ui/types"
import { PageDetailsEvent, PageDetailsDependencies } from "./types"
import { AnnotationConversationStates, AnnotationConversationState } from '../../../../content-conversations/ui/types'
import { getInitialAnnotationConversationStates } from '../../../../content-conversations/ui/utils'
import { annotationConversationEventHandlers } from '../../../../content-conversations/ui/logic'

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

        Object.assign(this, annotationConversationEventHandlers<PageDetailsState>(this as any, {
            ...this.dependencies,
            getAnnotation: (state, reference) => {
                const annotationId = this.dependencies.storage.contentSharing.getSharedAnnotationLinkID(reference)
                return state.annotations!.find(annotation => annotation.linkId === annotationId) ?? null
            },
            loadUser: this._loadUser,
        }))
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

    _loadUser = async (userReference: UserReference): Promise<User | null> => {
        if (this.users[userReference.id]) {
            return this.users[userReference.id]
        }

        const user = this.dependencies.userManagement.getUser(userReference)
        this.users[userReference.id] = user
        return user
    }
}
