import { UIEvent, UISignal } from "../../../../../main-ui/classes/logic";
import ContentSharingStorage from "../../../storage";
import { UIElementServices } from "../../../../../main-ui/classes";
import UserStorage from "../../../../user-management/storage";

export interface AnnotationDetailsDependencies {
    annotationID: string
    contentSharing: ContentSharingStorage
    userManagement: UserStorage
    services: UIElementServices<'auth' | 'overlay'>
}

export type AnnotationDetailsEvent = UIEvent<{
    toggleDescriptionTruncation: {}
    togglePageAnnotations: { normalizedUrl: string }
    toggleAllAnnotations: {}
    pageBreakpointHit: { entryIndex: number }
}>

export type AnnotationDetailsSignal = UISignal<
    { type: 'nothing-yet' }
>