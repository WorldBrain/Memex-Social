import { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import { getUserReference } from '@worldbrain/memex-common/ts/user-management/utils'
import UserPublicProfile from '../types'
import { AuthService } from '../../../services/auth/types'
import UserStorage from '../storage/'

export default class UserManagementService {
    constructor(
        private options: {
            auth: AuthService
            storage: UserStorage
        },
    ) {}

    userPublicProfilesCache: { [id: string]: UserPublicProfile } = {}

    /**
     * finds the user public profile for the userId specified returns this from cache if present,
     * otherwise retrieves from DB and caches before returning
     * @param userId id for a user
     */
    async loadUserPublicProfile(
        userId: string | number,
    ): Promise<UserPublicProfile> {
        if (this.userPublicProfilesCache[userId]) {
            return this.userPublicProfilesCache[userId]
        }
        const userReference: UserReference = userId
            ? getUserReference(userId)
            : await this.options.auth.getCurrentUserReference()!
        this.userPublicProfilesCache[
            userId
        ] = await this.options.storage.getUserPublicProfile(userReference)
        return this.userPublicProfilesCache[userId]
    }
}
