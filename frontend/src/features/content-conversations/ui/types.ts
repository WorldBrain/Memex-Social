import { ConversationThread, ConversationReply, ConversationReplyReference } from '@worldbrain/memex-common/lib/content-conversations/types'
import { UITaskState } from "../../../main-ui/types";
import { User } from '@worldbrain/memex-common/lib/web-interface/types/users';

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
