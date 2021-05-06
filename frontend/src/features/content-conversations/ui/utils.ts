import {
    AnnotationConversationState,
    AnnotationConversationStates,
    NewReplyState,
} from './types'
import fromPairs from 'lodash/fromPairs'

export function getInitialNewReplyState(): NewReplyState {
    return {
        saveState: 'pristine',
        editing: false,
        content: '',
    }
}

export function getInitialAnnotationConversationState(): AnnotationConversationState {
    return {
        loadState: 'pristine',
        expanded: false,
        newReply: getInitialNewReplyState(),
        replies: [],
    }
}

export function getInitialAnnotationConversationStates(
    annotations: Array<{ linkId: string }>,
): AnnotationConversationStates {
    return fromPairs(
        annotations.map((annotation) => [
            annotation.linkId,
            getInitialAnnotationConversationState(),
        ]),
    )
}
