import { UIEvent, UISignal } from "../../../../../main-ui/classes/logic";
import { UIElementServices } from "../../../../../main-ui/classes";
import { StorageModules } from "../../../../../storage/types";

export interface AnnotationDetailsDependencies {
    annotationID: string
    services: UIElementServices<'auth' | 'overlay' | 'router' | 'activityStreams'>
    storage: Pick<StorageModules, 'users' | 'contentSharing' | 'activityStreams'>
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
