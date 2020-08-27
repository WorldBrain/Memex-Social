import UserStorage from "../../../../user-management/storage";
import { UIEvent, UISignal } from "../../../../../main-ui/classes/logic";
import ContentSharingStorage from "../../../storage";

export interface PageDetailsDependencies {
    pageID: string
    contentSharing: ContentSharingStorage
    userManagement: UserStorage
}

export type PageDetailsEvent = UIEvent<{
    toggleDescriptionTruncation: {}
    togglePageAnnotations: { normalizedUrl: string }
    toggleAllAnnotations: {}
    pageBreakpointHit: { entryIndex: number }
}>

export type PageDetailsSignal = UISignal<
    { type: 'nothing-yet' }
>