import {
    AnnotationConversationState,
    AnnotationConversationStates,
} from './types'
import fromPairs from 'lodash/fromPairs'

export function getInitialAnnotationConversationState(): AnnotationConversationState {
    return {
        loadState: 'pristine',
        expanded: false,
        newReply: {
            saveState: 'pristine',
            editing: false,
            content: '',
        },
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
