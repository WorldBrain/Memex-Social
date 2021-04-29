import fromPairs from 'lodash/fromPairs'
import {
    AnnotationConversationsState,
    AnnotationConversationEvent,
    AnnotationConversationsHandlers,
    AnnotationConversationSignal,
} from './types'
import { UILogic, executeUITask } from '../../../main-ui/classes/logic'
import {
    UserReference,
    User,
} from '@worldbrain/memex-common/lib/web-interface/types/users'
import {
    SharedAnnotationReference,
    SharedAnnotation,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import { Services } from '../../../services/types'
import {
    getInitialNewReplyState,
    getInitialAnnotationConversationState,
} from './utils'
import { StorageModules } from '../../../storage/types'

export function annotationConversationInitialState(): AnnotationConversationsState {
    return {
        newPageReplies: {},
        conversations: {},
    }
}

export async function detectAnnotationConversationsThreads(
    logic: UILogic<AnnotationConversationsState, AnnotationConversationEvent>,
    normalizedPageUrls: string[],
    dependencies: {
        storage: Pick<StorageModules, 'contentConversations'>
    },
) {
    const threads = await dependencies.storage.contentConversations.getThreadsForPages(
        {
            normalizedPageUrls,
        },
    )
    logic.emitMutation({
        conversations: fromPairs(
            threads.map((threadData) => [
                threadData.sharedAnnotation.id,
                { thread: { $set: threadData.thread } },
            ]),
        ),
        newPageReplies: fromPairs(
            normalizedPageUrls.map((normalizedUrl) => [
                normalizedUrl,
                { $set: getInitialNewReplyState() },
            ]),
        ),
    })
}

export function annotationConversationEventHandlers<
    State extends AnnotationConversationsState
>(
    logic: UILogic<AnnotationConversationsState, AnnotationConversationEvent>,
    dependencies: {
        services: Pick<
            Services,
            'contentConversations' | 'auth' | 'activityStreams'
        >
        storage: Pick<StorageModules, 'contentSharing' | 'contentConversations'>
        loadUser(reference: UserReference): Promise<User | null>
        getAnnotation(
            state: State,
            reference: SharedAnnotationReference,
        ): {
            pageCreatorReference?: UserReference | null
            annotation: Pick<SharedAnnotation, 'normalizedPageUrl'>
        } | null
    },
): AnnotationConversationsHandlers {
    return {
        toggleAnnotationReplies: async ({ event, previousState }) => {
            const annotationId = dependencies.storage.contentSharing.getSharedAnnotationLinkID(
                event.annotationReference,
            )
            const conversationId = event.conversationId ?? annotationId
            const conversation = previousState.conversations[conversationId]

            const user = await dependencies.services.auth.getCurrentUser()

            logic.emitMutation({
                conversations: {
                    [conversationId]: {
                        expanded: { $set: !conversation.expanded },
                        newReply: {
                            $set: { ...conversation.newReply, editing: !!user },
                        },
                    },
                },
            })
            if (conversation.loadState !== 'pristine') {
                return
            }

            await executeUITask<AnnotationConversationsState>(
                logic,
                (taskState) => ({
                    conversations: {
                        [conversationId]: { loadState: { $set: taskState } },
                    },
                }),
                async () => {
                    const replies = await dependencies.storage.contentConversations.getRepliesByAnnotation(
                        {
                            annotationReference: event.annotationReference!,
                        },
                    )
                    return {
                        mutation: {
                            conversations: {
                                [conversationId]: {
                                    replies: {
                                        $set: await Promise.all(
                                            replies.map(async (reply) => ({
                                                ...reply,
                                                user: await dependencies.loadUser(
                                                    reply.userReference,
                                                ),
                                            })),
                                        ),
                                    },
                                },
                            },
                        },
                    }
                },
            )
        },
        initiateNewReplyToAnnotation: async ({ event }) => {
            const user = await dependencies.services.auth.getCurrentUser()
            if (!user) {
                const {
                    result,
                } = await dependencies.services.auth.requestAuth()
                logic.emitSignal<AnnotationConversationSignal>({
                    type: 'auth-requested',
                })
                if (
                    result.status !== 'authenticated' &&
                    result.status !== 'registered-and-authenticated'
                ) {
                    return {}
                }
            }

            const annotationId = dependencies.storage.contentSharing.getSharedAnnotationLinkID(
                event.annotationReference,
            )
            const conversationId = event.conversationId ?? annotationId
            return {
                conversations: {
                    [conversationId]: {
                        expanded: { $set: true },
                        newReply: { editing: { $set: true } },
                    },
                },
            }
        },
        editNewReplyToAnnotation: ({ event }) => {
            const annotationId = dependencies.storage.contentSharing.getSharedAnnotationLinkID(
                event.annotationReference,
            )
            const conversationId = event.conversationId ?? annotationId
            return {
                conversations: {
                    [conversationId]: {
                        newReply: { content: { $set: event.content } },
                    },
                },
            }
        },
        cancelNewReplyToAnnotation: ({ event }) => {
            const annotationId = dependencies.storage.contentSharing.getSharedAnnotationLinkID(
                event.annotationReference,
            )
            const conversationId = event.conversationId ?? annotationId
            return {
                conversations: {
                    [conversationId]: {
                        newReply: { editing: { $set: false } },
                    },
                },
            }
        },
        confirmNewReplyToAnnotation: async ({ event, previousState }) => {
            const annotationId = dependencies.storage.contentSharing.getSharedAnnotationLinkID(
                event.annotationReference,
            )
            const conversationId = event.conversationId ?? annotationId
            const annotationData = dependencies.getAnnotation(
                previousState as any,
                event.annotationReference,
            )
            const conversation = previousState.conversations[conversationId]
            const user = await dependencies.services.auth.getCurrentUser()
            if (!annotationData) {
                throw new Error(`Could not find annotation to sumbit reply to`)
            }
            const { pageCreatorReference } = annotationData
            if (!pageCreatorReference) {
                throw new Error(`Could not find annotation to sumbit reply to`)
            }
            if (!conversation) {
                throw new Error(`Could not find annotation to sumbit reply to`)
            }
            if (!user) {
                throw new Error(
                    `Tried to submit a reply without being authenticated`,
                )
            }

            const lastReply = conversation.replies.length
                ? conversation.replies[conversation.replies.length - 1]
                : null

            await executeUITask<AnnotationConversationsState>(
                logic,
                (taskState) => ({
                    conversations: {
                        [conversationId]: {
                            newReply: { saveState: { $set: taskState } },
                        },
                    },
                }),
                async () => {
                    logic.emitSignal<AnnotationConversationSignal>({
                        type: 'reply-submitting',
                    })
                    const result = await dependencies.services.contentConversations.submitReply(
                        {
                            annotationReference: event.annotationReference,
                            normalizedPageUrl:
                                annotationData.annotation.normalizedPageUrl,
                            pageCreatorReference,
                            reply: { content: conversation.newReply.content },
                            previousReplyReference:
                                lastReply?.reference ?? null,
                        },
                    )
                    if (result.status === 'not-authenticated') {
                        return { status: 'pristine' }
                    }
                    logic.emitMutation({
                        conversations: {
                            [conversationId]: {
                                newReply: { $set: getInitialNewReplyState() },
                                replies: {
                                    $push: [
                                        {
                                            reference: result.replyReference,
                                            reply: {
                                                createdWhen: Date.now(),
                                                normalizedPageUrl:
                                                    annotationData.annotation
                                                        .normalizedPageUrl,
                                                content:
                                                    conversation.newReply
                                                        .content,
                                            },
                                            user: user,
                                        },
                                    ],
                                },
                            },
                        },
                    })
                },
            )
        },
        initiateNewReplyToPage: async ({ event }) => {
            const { services } = dependencies
            const user = services.auth.getCurrentUser()
            if (!user) {
                const { result } = await services.auth.requestAuth()
                logic.emitSignal<AnnotationConversationSignal>({
                    type: 'auth-requested',
                })
                if (
                    result.status !== 'authenticated' &&
                    result.status !== 'registered-and-authenticated'
                ) {
                    return {}
                }
            }

            console.log('init:', event)

            return {
                newPageReplies: {
                    [event.normalizedPageUrl]: {
                        editing: { $set: true },
                    },
                },
            }
        },
        editNewReplyToPage: ({ event }) => ({
            newPageReplies: {
                [event.normalizedPageUrl]: {
                    content: { $set: event.content },
                },
            },
        }),
        cancelNewReplyToPage: ({ event }) => ({
            newPageReplies: {
                [event.normalizedPageUrl]: {
                    $set: getInitialNewReplyState(),
                },
            },
        }),
        confirmNewReplyToPage: async ({ event, previousState }) => {
            const { storage, services } = dependencies
            const userReference = services.auth.getCurrentUserReference()!

            const comment = previousState.newPageReplies[
                event.normalizedPageUrl
            ].content.trim()
            const createdWhen = Date.now()

            await executeUITask<AnnotationConversationsState>(
                logic,
                (taskState) => ({
                    newPageReplies: {
                        [event.normalizedPageUrl]: {
                            saveState: { $set: taskState },
                        },
                    },
                }),
                async () => {
                    const localId = '???' // TODO: figure this out
                    const {
                        sharedAnnotationReferences,
                    } = await storage.contentSharing.createAnnotations({
                        annotationsByPage: {
                            [event.normalizedPageUrl]: [
                                {
                                    createdWhen,
                                    localId,
                                    comment,
                                },
                            ],
                        },
                        creator: userReference,
                        listReferences: [], // TODO: opt. list refs
                    })

                    const conversationThread = await storage.contentConversations.getOrCreateThread(
                        {
                            normalizedPageUrl: event.normalizedPageUrl,
                            annotationReference:
                                sharedAnnotationReferences[localId],
                            sharedListReference: null,
                            pageCreatorReference: event.pageCreatorReference,
                        },
                    )

                    logic.emitMutation({
                        newPageReplies: {
                            [event.normalizedPageUrl]: {
                                $set: getInitialNewReplyState(),
                            },
                        },
                        conversations: {
                            [conversationThread.reference.id]: {
                                $set: getInitialAnnotationConversationState(),
                            },
                        },
                    })
                },
            )
        },
    }
}
