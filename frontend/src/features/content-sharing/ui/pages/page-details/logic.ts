import orderBy from 'lodash/orderBy'
import { User, UserReference } from "@worldbrain/memex-common/lib/web-interface/types/users"
import { SharedAnnotation, SharedPageInfo, SharedAnnotationReference } from "@worldbrain/memex-common/lib/content-sharing/types"
import { UILogic, UIEventHandler, executeUITask, UIMutation } from "../../../../../main-ui/classes/logic"
import { UITaskState } from "../../../../../main-ui/types"
import { PageDetailsEvent, PageDetailsDependencies } from "./types"
import { AnnotationConversationStates, AnnotationConversationState } from '../../../../content-conversations/ui/types'
import fromPairs from 'lodash/fromPairs'
import { getInitialAnnotationConversationStates } from '../../../../content-conversations/ui/utils'

export interface PageDetailsState {
    annotationLoadState: UITaskState
    annotations?: Array<SharedAnnotation & { reference: SharedAnnotationReference, linkId: string }> | null

    pageInfoLoadState: UITaskState
    pageInfo?: SharedPageInfo | null

    creatorLoadState: UITaskState
    creator?: User | null

    conversations: AnnotationConversationStates
}
type EventHandler<EventName extends keyof PageDetailsEvent> = UIEventHandler<PageDetailsState, PageDetailsEvent, EventName>

export default class PageDetailsLogic extends UILogic<PageDetailsState, PageDetailsEvent> {
    constructor(private dependencies: PageDetailsDependencies) {
        super()
    }

    getInitialState(): PageDetailsState {
        return {
            creatorLoadState: 'pristine',
            annotationLoadState: 'pristine',
            pageInfoLoadState: 'pristine',
            conversations: {},
        }
    }

    init: EventHandler<'init'> = async () => {
        const { contentSharing, userManagement } = this.dependencies
        const pageInfoReference = contentSharing.getSharedPageInfoReferenceFromLinkID(this.dependencies.pageID)
        let creatorReference: UserReference | null
        let pageInfo: SharedPageInfo | null
        await executeUITask<PageDetailsState>(this, 'pageInfoLoadState', async () => {
            const result = await contentSharing.getPageInfo(pageInfoReference)
            creatorReference = result?.creatorReference ?? null
            pageInfo = result?.pageInfo ?? null

            return {
                mutation: {
                    pageInfo: { $set: pageInfo }
                }
            }
        })
        await Promise.all([
            executeUITask<PageDetailsState>(this, 'annotationLoadState', async () => {
                if (!creatorReference || !pageInfo) {
                    return
                }

                const annotations = (await contentSharing.getAnnotationsByCreatorAndPageUrl({
                    creatorReference,
                    normalizedPageUrl: pageInfo.normalizedUrl,
                })).map(annotation => ({
                    ...annotation,
                    linkId: contentSharing.getSharedAnnotationLinkID(annotation.reference)
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

    toggleAnnotationReplies: EventHandler<'toggleAnnotationReplies'> = async ({ event }) => {
    }

    initiateReplyToAnnotation: EventHandler<'initiateReplyToAnnotation'> = ({ event }) => {
        const annotationId = this.dependencies.contentSharing.getSharedAnnotationLinkID(event.annotationReference)
        const mutation: UIMutation<AnnotationConversationState> = { editing: { $set: true } }
        return { conversations: { [annotationId]: mutation } }
    }

    cancelReplyToAnnotation: EventHandler<'cancelReplyToAnnotation'> = ({ event }) => {
        const annotationId = this.dependencies.contentSharing.getSharedAnnotationLinkID(event.annotationReference)
        const mutation: UIMutation<AnnotationConversationState> = { editing: { $set: false } }
        return { conversations: { [annotationId]: mutation } }
    }

    confirmReplyToAnnotation: EventHandler<'confirmReplyToAnnotation'> = async ({ event }) => {

    }
}
