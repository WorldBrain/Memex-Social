import { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import { ProfileWebLink, User, UserPublicProfile } from '../types'
import { AuthService } from '../../../services/auth/types'
import UserStorage from '../storage/'
import UserProfileCache from '../utils/user-profile-cache'

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
        userRef: UserReference,
    ): Promise<UserPublicProfile> {
        if (this.userPublicProfilesCache[userRef.id]) {
            return this.userPublicProfilesCache[userRef.id]
        }
        const userReference: UserReference = userRef
            ? userRef
            : await this.options.auth.getCurrentUserReference()!
        const publicProfile: UserPublicProfile = await this.options.storage.getUserPublicProfile(
            userReference,
        )
        this.userPublicProfilesCache[userRef.id] = publicProfile
        return publicProfile
    }

    async loadUserData(userRef: UserReference): Promise<User | null> {
        const userProfileCache = new UserProfileCache({
            storage: { users: this.options.storage },
        })
        return userProfileCache.loadUser(userRef)
    }
}
