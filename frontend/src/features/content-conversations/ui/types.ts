import {
    ConversationThread,
    ConversationReply,
    ConversationReplyReference,
} from '@worldbrain/memex-common/lib/content-conversations/types'
import { UITaskState } from '../../../main-ui/types'
import { User } from '@worldbrain/memex-common/lib/web-interface/types/users'
import {
    SharedAnnotationReference,
    SharedPageInfoReference,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import { UIEventHandler } from '../../../main-ui/classes/logic'
import { UserReference } from '../../user-management/types'

export interface NewReplyState {
    saveState: UITaskState
    editing: boolean
    content: string
}

export interface AnnotationConversationState {
    expanded: boolean
    loadState: UITaskState
    newReply: NewReplyState
    thread?: ConversationThread
    replies: Array<{
        reference: ConversationReplyReference
        reply: ConversationReply
        user?: Pick<User, 'displayName'> | null
        creatorReference?: UserReference
    }>
}

export type AnnotationConversationStates = {
    [conversationId: string]: AnnotationConversationState
}

export type NewPageReplyStates = {
    [pageId: string]: NewReplyState
}

export interface AnnotationConversationEvent {
    initiateNewReplyToAnnotation: {
        annotationReference: SharedAnnotationReference
        conversationId?: string
    }
    editNewReplyToAnnotation: {
        annotationReference: SharedAnnotationReference
        conversationId?: string
        content: string
    }
    cancelNewReplyToAnnotation: {
        annotationReference: SharedAnnotationReference
        conversationId?: string
    }
    confirmNewReplyToAnnotation: {
        annotationReference: SharedAnnotationReference
        conversationId?: string
    }
    toggleAnnotationReplies: {
        annotationReference: SharedAnnotationReference
        conversationId?: string
    }
    initiateNewReplyToPage: {
        pageReference: SharedPageInfoReference
    }
    editNewReplyToPage: {
        pageReference: SharedPageInfoReference
        content: string
    }
    cancelNewReplyToPage: {
        pageReference: SharedPageInfoReference
    }
    confirmNewReplyToPage: {
        pageReference: SharedPageInfoReference
    }
}

export type AnnotationConversationSignal =
    | { type: 'auth-requested' }
    | { type: 'reply-submitting' }

export interface AnnotationConversationsState {
    conversations: AnnotationConversationStates
    newPageReplies: NewPageReplyStates
}

export type AnnotationConversationsHandlers = {
    [EventName in keyof AnnotationConversationEvent]: UIEventHandler<
        AnnotationConversationsState,
        AnnotationConversationEvent,
        EventName
    >
}
