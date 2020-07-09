import { UIEvent } from "../../../../../main-ui/classes/logic";
import ContentSharingStorage from "../../../storage";

export interface CollectionDetailsDependencies {
    listID: string
    contentSharing: ContentSharingStorage
}
export type CollectionDetailsEvent = UIEvent<{
    toggleDescriptionTruncation: {}
}>

