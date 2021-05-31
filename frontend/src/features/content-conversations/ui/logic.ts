import { Services } from '../../../services/types'

export * from '@worldbrain/memex-common/lib/content-conversations/ui/logic'

export const setupAuthDeps = (dependencies: {
    services: Pick<Services, 'auth'>
}) => ({
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
