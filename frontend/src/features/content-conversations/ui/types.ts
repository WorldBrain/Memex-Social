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
        editing: boolean
        content: string
    }
}

export type AnnotationConversationStates = { [sharedAnnotationId: string]: AnnotationConversationState }

export type AnnotationConversationEvent = {
    initiateNewReplyToAnnotation: { annotationReference: SharedAnnotationReference }
    editNewReplyToAnnotation: { annotationReference: SharedAnnotationReference, content: string }
    cancelNewReplyToAnnotation: { annotationReference: SharedAnnotationReference }
    confirmNewReplyToAnnotation: { annotationReference: SharedAnnotationReference }
    toggleAnnotationReplies: { annotationReference: SharedAnnotationReference }
}
export type AnnotationConversationSignal = { type: 'auth-requested' }

export interface AnnotationConversationsState {
    conversations: AnnotationConversationStates
    conversationReplySubmitState: UITaskState
}

export type AnnotationConversationsHandlers = {
    [EventName in keyof AnnotationConversationEvent]:
    UIEventHandler<AnnotationConversationsState, AnnotationConversationEvent, EventName>
}