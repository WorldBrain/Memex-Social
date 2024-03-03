import {
    executeUITask,
    UILogic,
} from '@worldbrain/memex-common/lib/main-ui/classes/logic'
import type { HighlightRendererInterface } from '@worldbrain/memex-common/lib/in-page-ui/highlighting/types'
import type { UploadStorageUtils } from '@worldbrain/memex-common/lib/personal-cloud/backend/translation-layer/storage-utils'
import type { GetAnnotationListEntriesElement as AnnotationListEntries } from '@worldbrain/memex-common/lib/content-sharing/storage/types'
import type { PersonalAnnotation } from '@worldbrain/memex-common/lib/web-interface/types/storex-generated/personal-cloud'
import type {
    EditableAnnotationsEvent,
    EditableAnnotationsHandlers,
    EditableAnnotationsState,
} from './types'
import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'
import type { StorageModules } from '../../../storage/types'
import sanitizeHTMLhelper from '@worldbrain/memex-common/lib/utils/sanitize-html-helper'
import { processCommentForImageUpload } from '@worldbrain/memex-common/lib/annotations/processCommentForImageUpload'
import { ImageSupportInterface } from '@worldbrain/memex-common/lib/image-support/types'

export function editableAnnotationsInitialState(): EditableAnnotationsState {
    return {
        annotations: {},
        annotationEntryData: {},
        annotationEditStates: {},
        annotationHoverStates: {},
        annotationDeleteStates: {},
        currentUserReference: null,
    }
}

export function editableAnnotationsEventHandlers<
    State extends EditableAnnotationsState
>(
    logic: UILogic<EditableAnnotationsState, EditableAnnotationsEvent>,
    dependencies: {
        storage: Pick<StorageModules, 'contentSharing'>
        getHighlightRenderer?: () => HighlightRendererInterface | undefined
        getPersonalCloudStorageUtils: () => UploadStorageUtils | null
        imageSupport: ImageSupportInterface
    },
): EditableAnnotationsHandlers {
    return {
        setAnnotationEditing: async ({ event, previousState }) => {
            logic.emitMutation({
                annotationEditStates: {
                    [event.annotationId]: {
                        isEditing: { $set: event.isEditing },
                    },
                },
            })
        },
        setAnnotationHovering: async ({ event, previousState }) => {
            logic.emitMutation({
                annotationHoverStates: {
                    [event.annotationId]: {
                        isHovering: { $set: event.isHovering },
                    },
                },
            })
        },
        setAnnotationDeleting: async ({ event, previousState }) => {
            logic.emitMutation({
                annotationDeleteStates: {
                    [event.annotationId]: {
                        isDeleting: { $set: event.isDeleting },
                    },
                },
            })
        },
        changeAnnotationEditComment: async ({ event, previousState }) => {
            logic.emitMutation({
                annotationEditStates: {
                    [event.annotationId]: { comment: { $set: event.comment } },
                },
            })
        },
        confirmAnnotationDelete: async ({ event, previousState }) => {
            const annotation = previousState.annotations[event.annotationId]
            const highlightRenderer = dependencies.getHighlightRenderer?.()
            if (annotation.selector != null && highlightRenderer != null) {
                highlightRenderer.removeAnnotationHighlight({
                    id: event.annotationId,
                })
            }

            await executeUITask(
                logic,
                (loadState) => ({
                    annotationDeleteStates: {
                        [event.annotationId]: {
                            deleteState: { $set: loadState },
                        },
                    },
                }),
                async () => {
                    logic.emitMutation({
                        annotations: { $unset: [event.annotationId] },
                        annotationEntryData: {
                            [annotation.normalizedPageUrl]: {
                                $apply: (prev: AnnotationListEntries[]) =>
                                    prev.filter(
                                        (entry) =>
                                            entry.sharedAnnotation.id !==
                                            event.annotationId,
                                    ),
                            },
                        },
                    })

                    await dependencies.storage.contentSharing.removeAnnotations(
                        {
                            sharedAnnotationReferences: [annotation.reference],
                        },
                    )
                },
            )

            // Clean up unused states related to this annotation (important this happens after the async stuff, as the UITaskState exists in one of these)
            logic.emitMutation({
                annotationEditStates: { $unset: [event.annotationId] },
                annotationHoverStates: { $unset: [event.annotationId] },
                annotationDeleteStates: { $unset: [event.annotationId] },
            })
        },
        confirmAnnotationEdit: async ({ event, previousState }) => {
            const annotation = previousState.annotations[event.annotationId]
            const editState =
                previousState.annotationEditStates[event.annotationId]
            if (!editState) {
                throw new Error(
                    'Attempted annotation edit for non-existent annotation',
                )
            }
            const personalCloudStorageUtils = dependencies.getPersonalCloudStorageUtils?.()
            if (personalCloudStorageUtils == null) {
                throw new Error(
                    'Attempted annotation edit without personal cloud storage utils being setup',
                )
            }

            let sanitizedAnnotation

            if (editState.comment && editState.comment.length > 0) {
                sanitizedAnnotation = sanitizeHTMLhelper(
                    editState.comment?.trim(),
                )
            }

            let annotationCommentWithImagesNoUpload = sanitizedAnnotation
            if (sanitizedAnnotation) {
                annotationCommentWithImagesNoUpload = await processCommentForImageUpload(
                    sanitizedAnnotation,
                    annotation.normalizedPageUrl,
                    null,
                    dependencies.imageSupport,
                    true,
                )
            }

            logic.emitMutation({
                annotations: {
                    [event.annotationId]: {
                        comment: { $set: annotationCommentWithImagesNoUpload },
                    },
                },
                annotationEditStates: {
                    [event.annotationId]: { isEditing: { $set: false } },
                },
            })

            let annotationCommentWithImagesWithUpload = sanitizedAnnotation
            if (sanitizedAnnotation) {
                annotationCommentWithImagesWithUpload = await processCommentForImageUpload(
                    sanitizedAnnotation,
                    annotation.normalizedPageUrl,
                    null,
                    dependencies.imageSupport,
                    false,
                )
            }

            await executeUITask(
                logic,
                (loadState) => ({
                    annotationEditStates: {
                        [event.annotationId]: {
                            loadState: { $set: loadState },
                        },
                    },
                }),
                async () => {
                    // Skip storage ops early if no change
                    if (annotation.comment === editState.comment) {
                        return
                    }

                    await dependencies.storage.contentSharing.updateAnnotationComment(
                        {
                            updatedComment: annotationCommentWithImagesWithUpload,
                            sharedAnnotationReference: {
                                type: 'shared-annotation-reference',
                                id: event.annotationId,
                            },
                        },
                    )

                    // Update personal cloud DB to trigger sync changes
                    // TODO: Probably move this to a `onUpdate` storage hook (when supported) rather than manually doing here
                    const personalAnnotation = await personalCloudStorageUtils!.findOne<
                        PersonalAnnotation & { id: AutoPk }
                    >('personalAnnotation', {
                        localId: annotation.createdWhen.toString(),
                    })
                    await personalCloudStorageUtils!.updateById(
                        'personalAnnotation',
                        personalAnnotation.id,
                        {
                            comment: annotationCommentWithImagesWithUpload,
                        },
                    )
                },
            )
        },
    }
}

export function hasUnsavedAnnotationEdits(
    state: EditableAnnotationsState,
): boolean {
    const editingAnyAnnots = Object.values(state.annotationEditStates).reduce(
        (prev, curr) => prev || curr.isEditing,
        false,
    )
    return editingAnyAnnots
}
