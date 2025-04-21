import { Services } from '../../../services/types'
import ContentConversationStorage from '../storage'
import ContentSharingStorage from '../../content-sharing/storage'
import {
    SharedAnnotationReference,
    SharedListReference,
} from '@worldbrain/memex-common/lib/content-sharing/types'

export * from '@worldbrain/memex-common/lib/content-conversations/ui/logic'

export const setupConversationLogicDeps = ({
    services,
    storage,
}: {
    services: Pick<
        Services,
        'auth' | 'contentConversations' | 'contentSharing' | 'ragPipeline'
    >
    storage: {
        contentSharing: Pick<
            ContentSharingStorage,
            'getSharedAnnotationLinkID' | 'createAnnotations'
        >
        contentConversations: Pick<
            ContentConversationStorage,
            'getThreadsForAnnotations' | 'getOrCreateThread'
        >
    }
}) => ({
    submitNewReply: services.contentConversations.submitReply.bind(
        services.contentConversations,
    ),
    deleteReply: services.contentConversations.deleteReply.bind(
        services.contentConversations,
    ),
    editReply: services.contentConversations.editReply.bind(
        services.contentConversations,
    ),
    createAnnotations: (async (params) => {
        const result = await storage.contentSharing.createAnnotations(params)
        const annotations = Object.entries(params.annotationsByPage).flatMap(
            ([normalizedPageUrl, annotations]) =>
                annotations.map((annot) => ({
                    ...annot,
                    normalizedPageUrl,
                })),
        )

        // Spawn off ingestion requests for each annotation in each list (though don't wait for them)
        Promise.all(
            params.listReferences.map((listReference) =>
                services.ragPipeline.ingestAnnotations({
                    sharedListReference: listReference,
                    annotations: annotations.map((annot) => ({
                        ...annot,
                        id: result.sharedAnnotationReferences[annot.localId].id,
                        updatedWhen: annot.createdWhen,
                        creator: params.creator,
                    })),
                }),
            ),
        )

        return result
    }) as ContentSharingStorage['createAnnotations'],
    getSharedAnnotationLinkID: storage.contentSharing.getSharedAnnotationLinkID.bind(
        storage.contentSharing,
    ),
    getRepliesByAnnotation: async (params: {
        annotationReference: SharedAnnotationReference
        sharedListReference: SharedListReference | null
    }) => {
        const result = await services.contentSharing.backend.loadAnnotationReplies(
            {
                listId: params.sharedListReference?.id ?? null,
                annotationId: params.annotationReference.id,
            },
        )
        if (result.status !== 'success') {
            throw new Error(
                `Expected 'success status retrieving replies, got '${result.status}'`,
            )
        }
        return result.data.replies
    },
    getCurrentUser: async () => {
        const user = services.auth.getCurrentUser()
        const reference = services.auth.getCurrentUserReference()

        return !user || !reference ? null : { ...user, reference }
    },
    isAuthorizedToConverse: async () => {
        const { result } = await services.auth.requestAuth()

        return (
            result.status === 'authenticated' ||
            result.status === 'registered-and-authenticated'
        )
    },
})
