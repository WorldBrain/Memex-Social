import type { UIEvent, UISignal } from '../../../../../main-ui/classes/logic'
import type { UIElementServices } from '../../../../../services/types'
import type { StorageModules } from '../../../../../storage/types'

export interface AnnotationDetailsDependencies {
    annotationID: string
    services: UIElementServices<
        | 'auth'
        | 'overlay'
        | 'router'
        | 'activityStreams'
        | 'userManagement'
        | 'webMonetization'
        | 'documentTitle'
    >
    storage: Pick<
        StorageModules,
        'users' | 'contentSharing' | 'activityStreams'
    >
    getRootElement: () => HTMLElement
}

export type AnnotationDetailsEvent = UIEvent<{
    toggleDescriptionTruncation: {}
    togglePageAnnotations: { normalizedUrl: string }
    toggleAllAnnotations: {}
    pageBreakpointHit: { entryIndex: number }
}>

export type AnnotationDetailsSignal = UISignal<{ type: 'nothing-yet' }>
