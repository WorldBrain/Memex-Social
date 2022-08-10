import { Services } from '../../../services/types'
import ContentConversationStorage from '../storage'
import ContentSharingStorage from '../../content-sharing/storage'

export * from '@worldbrain/memex-common/lib/content-conversations/ui/logic'

export const setupConversationLogicDeps = ({
    services,
    storage,
}: {
    services: Pick<Services, 'auth' | 'contentConversations'>
    storage: {
        contentSharing: Pick<
            ContentSharingStorage,
            'getSharedAnnotationLinkID' | 'createAnnotations'
        >
        contentConversations: Pick<
            ContentConversationStorage,
            | 'getThreadsForAnnotations'
            | 'getOrCreateThread'
            | 'getRepliesByAnnotation'
        >
    }
}) => ({
    submitNewReply: services.contentConversations.submitReply.bind(
        services.contentConversations,
    ),
    createAnnotations: storage.contentSharing.createAnnotations.bind(
        storage.contentSharing,
    ),
    getSharedAnnotationLinkID: storage.contentSharing.getSharedAnnotationLinkID.bind(
        storage.contentSharing,
    ),
    getRepliesByAnnotation: storage.contentConversations.getRepliesByAnnotation.bind(
        storage.contentConversations,
    ),
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
