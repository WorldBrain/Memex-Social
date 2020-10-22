import { ConversationThread, ConversationReply } from '@worldbrain/memex-common/lib/content-conversations/types'
import { UITaskState } from "../../../main-ui/types";

export interface AnnotationConversationState {
    expanded: boolean
    editing: boolean
    loadState: UITaskState
    conversation?: AnnotationConversationStateData
}

export interface AnnotationConversationStateData {
    thread: ConversationThread;
    replies: ConversationReply[];
}

export type AnnotationConversationStates = { [sharedAnnotationId: string]: AnnotationConversationState }
