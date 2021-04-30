import fromPairs from 'lodash/fromPairs'
import {
    AnnotationConversationsState,
    AnnotationConversationEvent,
    AnnotationConversationsHandlers,
    AnnotationConversationSignal,
} from './types'
import { UILogic, executeUITask } from '../../../main-ui/classes/logic'
import ContentSharingStorage from '../../content-sharing/storage'
import ContentConversationStorage from '../storage'
import {
    UserReference,
    User,
} from '@worldbrain/memex-common/lib/web-interface/types/users'
import {
    SharedAnnotationReference,
    SharedAnnotation,
    SharedListReference,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import { Services } from '../../../services/types'

export function annotationConversationInitialState(): AnnotationConversationsState {
    return {
        conversations: {},
    }
}

export async function detectAnnotationConversationThreads(
    logic: UILogic<AnnotationConversationsState, AnnotationConversationEvent>,
    annotationReferences: SharedAnnotationReference[],
    dependencies: {
        storage: {
            contentConversations: ContentConversationStorage
        }
    },
) {
    const threads = await dependencies.storage.contentConversations.getThreadsForAnnotations(
        {
            annotationReferences,
        },
    )
    logic.emitMutation({
        conversations: fromPairs(
            threads.map((threadData) => [
                threadData.sharedAnnotation.id,
                { thread: { $set: threadData.thread } },
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
        storage: {
            contentSharing: ContentSharingStorage
            contentConversations: ContentConversationStorage
        }
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
                                newReply: {
                                    $set: {
                                        saveState: 'pristine',
                                        editing: false,
                                        content: '',
                                    },
                                },
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
    }
}
