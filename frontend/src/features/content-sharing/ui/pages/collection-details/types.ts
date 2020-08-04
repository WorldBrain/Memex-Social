import UserStorage from "../../../../user-management/storage";
import { UIEvent } from "../../../../../main-ui/classes/logic";
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
