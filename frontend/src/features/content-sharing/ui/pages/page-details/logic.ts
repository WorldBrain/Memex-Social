import orderBy from 'lodash/orderBy'
import { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import {
    SharedPageInfo,
    SharedAnnotationReference,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import {
    UILogic,
    UIEventHandler,
    executeUITask,
} from '../../../../../main-ui/classes/logic'
import {
    PageDetailsEvent,
    PageDetailsDependencies,
    PageDetailsState,
    PageDetailsSignal,
} from './types'
import { getInitialAnnotationConversationStates } from '../../../../content-conversations/ui/utils'
import {
    annotationConversationEventHandlers,
    annotationConversationInitialState,
    detectAnnotationConversationThreads,
    setupConversationLogicDeps,
} from '../../../../content-conversations/ui/logic'
import {
    listsSidebarInitialState,
    listsSidebarEventHandlers,
} from '../../../../lists-sidebar/ui/logic'
import UserProfileCache from '../../../../user-management/utils/user-profile-cache'

type EventHandler<EventName extends keyof PageDetailsEvent> = UIEventHandler<
    PageDetailsState,
    PageDetailsEvent,
    EventName
>

export default class PageDetailsLogic extends UILogic<
    PageDetailsState,
    PageDetailsEvent
> {
    _users: UserProfileCache

    constructor(private dependencies: PageDetailsDependencies) {
        super()

        this._users = new UserProfileCache(dependencies)

        Object.assign(
            this,
            annotationConversationEventHandlers<PageDetailsState>(this as any, {
                ...this.dependencies,
                ...setupConversationLogicDeps(this.dependencies),
                getSharedListReference: () => null,
                selectAnnotationData: (state, reference) => {
                    const annotationId = this.dependencies.storage.contentSharing.getSharedAnnotationLinkID(
                        reference,
                    )
                    const annotation = state.annotations!.find(
                        (annotation) => annotation.linkId === annotationId,
                    )
                    if (!annotation || !state.creatorReference) {
                        return null
                    }
                    return {
                        normalizedPageUrl: annotation.normalizedPageUrl,
                        pageCreatorReference: state.creatorReference,
                    }
                },
                loadUserByReference: (reference) =>
                    this._users.loadUser(reference),
                onNewAnnotationCreate: (_, annotation) => {
                    this.emitMutation({
                        annotations: { $push: [annotation] },
                    })
                    return this.dependencies.services.userMessages.pushMessage({
                        type: 'created-annotation',
                        sharedAnnotationId: annotation.reference.id,
                    })
                },
            }),
        )

        Object.assign(
            this,
            listsSidebarEventHandlers(this as any, {
                ...this.dependencies,
                localStorage: this.dependencies.services.localStorage,
            }),
        )
    }

    getInitialState(): PageDetailsState {
        return {
            creatorLoadState: 'pristine',
            annotationLoadState: 'pristine',
            pageInfoLoadState: 'pristine',
            ...listsSidebarInitialState(),
            ...annotationConversationInitialState(),
        }
    }

    init: EventHandler<'init'> = async (incoming) => {
        const { storage, userManagement } = this.dependencies
        const pageInfoReference = storage.contentSharing.getSharedPageInfoReferenceFromLinkID(
            this.dependencies.pageID,
        )
        let creatorReference: UserReference | null
        let pageInfo: SharedPageInfo | null
        let annotationReferences: SharedAnnotationReference[] = []
        await executeUITask<PageDetailsState>(
            this,
            'pageInfoLoadState',
            async () => {
                const result = await storage.contentSharing.getPageInfo(
                    pageInfoReference,
                )
                creatorReference = result?.creatorReference ?? null
                pageInfo = result?.pageInfo ?? null

                return {
                    mutation: {
                        pageInfo: { $set: pageInfo },
                        pageInfoReference: { $set: result?.reference },
                        creatorReference: { $set: creatorReference },
                    },
                }
            },
        )
        await Promise.all([
            executeUITask<PageDetailsState>(
                this,
                'annotationLoadState',
                async () => {
                    if (!creatorReference || !pageInfo) {
                        return
                    }

                    const annotations = (
                        await storage.contentSharing.getAnnotationsByCreatorAndPageUrl(
                            {
                                creatorReference,
                                normalizedPageUrl: pageInfo.normalizedUrl,
                            },
                        )
                    ).map((annotation) => ({
                        ...annotation,
                        linkId: storage.contentSharing.getSharedAnnotationLinkID(
                            annotation.reference,
                        ),
                    }))
                    annotationReferences = annotations.map(
                        (annotation) => annotation.reference,
                    )
                    return {
                        mutation: {
                            annotations: {
                                $set: orderBy(annotations, [
                                    'createdWhen',
                                    'desc',
                                ]),
                            },
                            conversations: {
                                $set: getInitialAnnotationConversationStates(
                                    annotations,
                                ),
                            },
                        },
                    }
                },
            ).then(() => {
                if (!pageInfo) {
                    return
                }
                detectAnnotationConversationThreads(this as any, {
                    annotationReferences,
                    getThreadsForAnnotations: (...args) =>
                        this.dependencies.storage.contentConversations.getThreadsForAnnotations(
                            ...args,
                        ),
                }).catch(console.error)
            }),
            executeUITask<PageDetailsState>(
                this,
                'creatorLoadState',
                async () => {
                    if (!creatorReference) {
                        return
                    }

                    return {
                        mutation: {
                            creator: {
                                $set: await userManagement.getUser(
                                    creatorReference,
                                ),
                            },
                        },
                    }
                },
            ),
        ])
        this.emitSignal<PageDetailsSignal>({ type: 'loaded' })
        await this.processUIEvent('initActivityFollows', incoming)
    }
}
