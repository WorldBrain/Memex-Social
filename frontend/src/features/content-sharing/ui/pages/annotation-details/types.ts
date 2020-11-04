import { UIEvent, UISignal } from "../../../../../main-ui/classes/logic";
import { UIElementServices } from "../../../../../main-ui/classes";
import { StorageModules } from "../../../../../storage/types";

export interface AnnotationDetailsDependencies {
    annotationID: string
    services: UIElementServices<'auth' | 'overlay'>
    storage: Pick<StorageModules, 'users' | 'contentSharing'>
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