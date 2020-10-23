import { AnnotationConversationState, AnnotationConversationStates } from "./types";
import { SharedAnnotation } from "@worldbrain/memex-common/lib/content-sharing/types";
import fromPairs from "lodash/fromPairs";

export function getInitialAnnotationConversationState(): AnnotationConversationState {
    return {
        loadState: 'pristine',
        expanded: false,
        newReply: {
            editing: false,
            content: ''
        },
        replies: [],
    }
}

export function getInitialAnnotationConversationStates(
    annotations: Array<SharedAnnotation & { linkId: string }>,
): AnnotationConversationStates {
    return fromPairs(annotations.map(annotation => [
        annotation.linkId,
        getInitialAnnotationConversationState()
    ]))
}
