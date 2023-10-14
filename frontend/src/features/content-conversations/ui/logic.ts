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
    services: Pick<Services, 'auth' | 'contentConversations' | 'contentSharing'>
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
    createAnnotations: storage.contentSharing.createAnnotations.bind(
        storage.contentSharing,
    ),
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
