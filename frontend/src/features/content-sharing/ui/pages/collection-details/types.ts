import UserStorage from "../../../../user-management/storage";
import { UIEvent, UISignal } from "../../../../../main-ui/classes/logic";
import ContentSharingStorage from "../../../storage";

export interface CollectionDetailsDependencies {
    listID: string
    contentSharing: ContentSharingStorage
    userManagement: UserStorage
}

export type CollectionDetailsEvent = UIEvent<{
    toggleDescriptionTruncation: {}
    togglePageAnnotations: { normalizedUrl: string }
    toggleAllAnnotations: {}
    pageBreakpointHit: { entryIndex: number }
}>

export type CollectionDetailsSignal = UISignal<
    | { type: 'loading-started' }
    | { type: 'loaded-list-data', success: boolean }
    | { type: 'loaded-annotation-entries', success: boolean }
    | { type: 'annotation-loading-started' }
    | { type: 'loaded-annotations', success: boolean }
>