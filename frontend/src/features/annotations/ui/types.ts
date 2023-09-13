import type {
    GetAnnotationListEntriesResult as AnnotationListEntriesDict,
    GetAnnotationsResult as SharedAnnotationDict,
} from '@worldbrain/memex-common/lib/content-sharing/storage/types'
import type { UIEventHandler } from '@worldbrain/memex-common/lib/main-ui/classes/logic'
import type { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'
import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'
import type { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'

export type EditableAnnotationsHandlers = {
    [EventName in keyof EditableAnnotationsEvent]: UIEventHandler<
        EditableAnnotationsState,
        EditableAnnotationsEvent,
        EventName
    >
}

export interface EditableAnnotationsEvent {
    setAnnotationEditing: { annotationId: AutoPk; isEditing: boolean }
    setAnnotationHovering: { annotationId: AutoPk; isHovering: boolean }
    setAnnotationDeleting: { annotationId: AutoPk; isDeleting: boolean }
    confirmAnnotationEdit: { annotationId: AutoPk }
    confirmAnnotationDelete: { annotationId: AutoPk }
    changeAnnotationEditComment: {
        annotationId: AutoPk
        comment: string
    }
}

export interface EditableAnnotationsState {
    annotations: SharedAnnotationDict
    annotationEntryData: AnnotationListEntriesDict
    annotationEditStates: {
        [annotationId: string]: {
            comment: string
            isEditing: boolean
            loadState: UITaskState
        }
    }
    annotationHoverStates: {
        [annotationId: string]: {
            isHovering: boolean
        }
    }
    annotationDeleteStates: {
        [annotationId: string]: {
            /** Denotes whether the annotation is in "confirm delete?" mode. */
            isDeleting: boolean
            deleteState: UITaskState
        }
    }
    currentUserReference: UserReference | null
}
