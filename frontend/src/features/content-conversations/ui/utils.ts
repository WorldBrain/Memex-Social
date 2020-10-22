import { AnnotationConversationState, AnnotationConversationStates } from "./types";
import { SharedAnnotation } from "@worldbrain/memex-common/lib/content-sharing/types";
import fromPairs from "lodash/fromPairs";
import ContentSharingStorage from "../../content-sharing/storage";

export function getInitialAnnotationConversationState(): AnnotationConversationState {
    return { expanded: false, editing: false, loadState: 'pristine' }
}

export function getInitialAnnotationConversationStates(
    annotations: Array<SharedAnnotation & { linkId: string }>,
): AnnotationConversationStates {
    return fromPairs(annotations.map(annotation => [
        annotation.linkId,
        getInitialAnnotationConversationState()
    ]))
}
