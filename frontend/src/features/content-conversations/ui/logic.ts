import { AnnotationConversationsState, AnnotationConversationEvent, AnnotationConversationsHandlers } from "./types";
import { UILogic, UIEventHandler, executeUITask } from "../../../main-ui/classes/logic";
import { UIElementServices } from "../../../main-ui/classes";
import ContentSharingStorage from "../../content-sharing/storage";
import ContentConversationStorage from "../storage";
import { UserReference, User } from "@worldbrain/memex-common/lib/web-interface/types/users";
import { SharedAnnotationReference, SharedAnnotation } from "@worldbrain/memex-common/lib/content-sharing/types";

export function annotationConversationEventHandlers<State extends AnnotationConversationsState>(
    logic: UILogic<AnnotationConversationsState, AnnotationConversationEvent>,
    dependencies: {
        pageID: string
        services: UIElementServices<'contentConversations' | 'auth'>;
        storage: {
            contentSharing: ContentSharingStorage,
            contentConversations: ContentConversationStorage
        },
        loadUser(reference: UserReference): Promise<User | null>
        getAnnotation(state: State, reference: SharedAnnotationReference): Pick<SharedAnnotation, 'normalizedPageUrl'> | null
    }
): AnnotationConversationsHandlers {
    return {
        toggleAnnotationReplies: async ({ event, previousState }) => {
            const annotationId = dependencies.storage.contentSharing.getSharedAnnotationLinkID(event.annotationReference)
            const conversation = previousState.conversations[annotationId]

            logic.emitMutation({ conversations: { [annotationId]: { expanded: { $set: !conversation.expanded } } } })
            if (conversation.loadState !== 'pristine') {
                return
            }

            await executeUITask<AnnotationConversationsState>(logic, taskState => ({
                conversations: { [annotationId]: { loadState: { $set: taskState } } }
            }), async () => {
                const replies = await dependencies.storage.contentConversations.getRepliesByAnnotation({
                    annotationReference: event.annotationReference!,
                })
                return {
                    mutation: {
                        conversations: {
                            [annotationId]: {
                                replies: {
                                    $set: await Promise.all(replies.map(async reply => ({
                                        ...reply,
                                        user: await dependencies.loadUser(reply.userReference)
                                    })))
                                }
                            }
                        }
                    }
                }
            })
        },
        initiateNewReplyToAnnotation: ({ event }) => {
            const annotationId = dependencies.storage.contentSharing.getSharedAnnotationLinkID(event.annotationReference)
            return {
                conversations: {
                    [annotationId]: {
                        expanded: { $set: true },
                        newReply: { editing: { $set: true } }
                    }
                }
            }
        },
        editNewReplyToAnnotation: ({ event }) => {
            const annotationId = dependencies.storage.contentSharing.getSharedAnnotationLinkID(event.annotationReference)
            return { conversations: { [annotationId]: { newReply: { content: { $set: event.content } } } } }
        },
        cancelNewReplyToAnnotation: ({ event }) => {
            const annotationId = dependencies.storage.contentSharing.getSharedAnnotationLinkID(event.annotationReference)
            return { conversations: { [annotationId]: { newReply: { editing: { $set: false } } } } }
        },
        confirmNewReplyToAnnotation: async ({ event, previousState }) => {
            const annotationId = dependencies.storage.contentSharing.getSharedAnnotationLinkID(event.annotationReference)
            const annotation = dependencies.getAnnotation(previousState as any, event.annotationReference)
            const conversation = previousState.conversations[annotationId]
            const user = await dependencies.services.auth.getCurrentUser()
            if (!annotation) {
                throw new Error(`Could not find annotation to sumbit reply to`)
            }
            if (!conversation) {
                throw new Error(`Could not find annotation to sumbit reply to`)
            }
            if (!user) {
                throw new Error(`Tried to submit a reply without being authenticated`)
            }

            const pageInfoReference = dependencies.storage.contentSharing.getSharedPageInfoReferenceFromLinkID(dependencies.pageID)
            await executeUITask<AnnotationConversationsState>(logic, 'conversationReplySubmitState', async () => {
                const result = await dependencies.services.contentConversations.submitReply({
                    pageInfoReference: pageInfoReference,
                    annotationReference: event.annotationReference,
                    normalizedPageUrl: annotation.normalizedPageUrl,
                    reply: { content: conversation.newReply.content }
                })
                if (result.status === 'not-authenticated') {
                    return { status: 'pristine' }
                }
                logic.emitMutation({
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
    }
}
