import { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import UserPublicProfile from '../types'
import { AuthService } from '../../../services/auth/types'
import UserStorage from '../storage/'
import { NormalisedData } from './types'

export default class UserManagementService {
    constructor(
        private options: {
            auth: AuthService
            storage: UserStorage
        },
    ) {}

    currentUserPublicProfile: UserPublicProfile | null = null

    userPublicProfilesCache: NormalisedData<UserPublicProfile> = {}

    getUserReference(userId: string | number): UserReference {
        return { type: 'user-reference', id: userId }
    }

    /**
     * finds the user public profile for the userId specified, or for the current user if no id is given
     * returns this from cache if present, otherwise retrieves from DB and caches before returning
     * @param userId string id for a user. Defaults to current user if not specified
     */
    async getUserPublicProfile(
        userId?: string | number,
    ): Promise<UserPublicProfile> {
        if (!userId && this.currentUserPublicProfile) {
            return this.currentUserPublicProfile
        } else if (userId && this.userPublicProfilesCache[userId]) {
            return this.userPublicProfilesCache[userId]
        }
        const userReference: UserReference = userId
            ? this.getUserReference(userId)
            : await this.options.auth.getCurrentUserReference()!
        const userPublicProfile: UserPublicProfile = await this.options.storage.getUserPublicProfile(
            userReference,
        )
        if (!userId) {
            this.currentUserPublicProfile = userPublicProfile
        } else {
            this.userPublicProfilesCache[userId] = userPublicProfile
        }
        return userPublicProfile
    }
}
