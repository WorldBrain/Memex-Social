import { Services } from '../../../services/types'
import ContentConversationStorage from '../storage'
import ContentSharingStorage from '../../content-sharing/storage'

export * from '@worldbrain/memex-common/lib/content-conversations/ui/logic'

export const setupConversationLogicDeps = (dependencies: {
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
    createAnnotations: dependencies.storage.contentSharing.createAnnotations,
    submitNewReply: dependencies.services.contentConversations.submitReply,
    getRepliesByAnnotation:
        dependencies.storage.contentConversations.getRepliesByAnnotation,
    getSharedAnnotationLinkID:
        dependencies.storage.contentSharing.getSharedAnnotationLinkID,
    getOrCreateConversationThread:
        dependencies.storage.contentConversations.getOrCreateThread,
    getCurrentUser: async () => {
        const { auth } = dependencies.services

        const user = auth.getCurrentUser()
        const reference = auth.getCurrentUserReference()

        return !user || !reference ? null : { ...user, reference }
    },
    isAuthorizedToConverse: async () => {
        const { result } = await dependencies.services.auth.requestAuth()

        return (
            result.status === 'authenticated' ||
            result.status === 'registered-and-authenticated'
        )
    },
})
