import { ConversationThread, ConversationReply, ConversationReplyReference } from '@worldbrain/memex-common/lib/content-conversations/types'
import { UITaskState } from "../../../main-ui/types";
import { User } from '@worldbrain/memex-common/lib/web-interface/types/users';
import { SharedAnnotationReference } from '@worldbrain/memex-common/lib/content-sharing/types';
import { UIEventHandler } from '../../../main-ui/classes/logic';

export interface AnnotationConversationState {
    expanded: boolean
    loadState: UITaskState
    thread?: ConversationThread
    replies: Array<{
        reference: ConversationReplyReference
        reply: ConversationReply
        user?: Pick<User, 'displayName'> | null
    }>
    newReply: {
        saveState: UITaskState
        editing: boolean
        content: string
    }
}

export type AnnotationConversationStates = { [conversationId: string]: AnnotationConversationState }

export type AnnotationConversationEvent = {
    initiateNewReplyToAnnotation: { annotationReference: SharedAnnotationReference, conversationId?: string }
    editNewReplyToAnnotation: { annotationReference: SharedAnnotationReference, conversationId?: string, content: string }
    cancelNewReplyToAnnotation: { annotationReference: SharedAnnotationReference, conversationId?: string }
    confirmNewReplyToAnnotation: { annotationReference: SharedAnnotationReference, conversationId?: string }
    toggleAnnotationReplies: { annotationReference: SharedAnnotationReference, conversationId?: string }
}
export type AnnotationConversationSignal = { type: 'auth-requested' } | { type: 'reply-submitting' }

export interface AnnotationConversationsState {
    conversations: AnnotationConversationStates
}

export type AnnotationConversationsHandlers = {
    [EventName in keyof AnnotationConversationEvent]:
    UIEventHandler<AnnotationConversationsState, AnnotationConversationEvent, EventName>
}