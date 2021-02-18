import { User, UserPublicProfile, UserReference } from '../types'
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

    private _updateCache(
        userRef: UserReference,
        profileData: UserPublicProfile,
    ) {
        this.userPublicProfilesCache[userRef.id] = profileData
    }

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

    async createUserPublicProfile(
        userRef: UserReference,
        profileData: UserPublicProfile,
    ): Promise<void> {
        await this.options.storage.createOrUpdateUserPublicProfile(
            userRef,
            { knownStatus: 'new' },
            profileData,
        )
    }

    async updateUserPublicProfile(
        userRef: UserReference,
        profileData: UserPublicProfile,
    ): Promise<void> {
        try {
            await this.options.storage.createOrUpdateUserPublicProfile(
                userRef,
                { knownStatus: 'exists' },
                profileData,
            )
            this._updateCache(userRef, profileData)
        } catch (err) {
            console.log('userStorage.updateUserPublicProfile error')
            console.error(err)
        }
    }

    async updateUserDisplayName(
        userRef: UserReference,
        value: string,
    ): Promise<void> {
        await this.options.storage.updateUser(
            userRef,
            { knownStatus: 'exists' },
            { displayName: value },
        )
    }

    async loadUserData(userRef: UserReference): Promise<User | null> {
        const userProfileCache = new UserProfileCache({
            storage: { users: this.options.storage },
        })
        return userProfileCache.loadUser(userRef)
    }
}
