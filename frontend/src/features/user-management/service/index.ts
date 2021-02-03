import { ProfileWebLink, User, UserPublicProfile, UserReference } from '../types'
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

    async createUserPublicProfile(userRef: UserReference, profileData: UserPublicProfile): Promise<void> {
        await this.options.storage.createOrUpdateUserPublicProfile(userRef, {knownStatus: 'new'}, profileData)
    }

    async updateUserPublicProfile(userRef: UserReference, profileData: UserPublicProfile): Promise<void> {
        await this.options.storage.createOrUpdateUserPublicProfile(userRef, {knownStatus: 'exists'}, profileData)
    }

    async updateUserDisplayName(userRef: UserReference, value: string): Promise<void> {
        await this.options.storage.updateUser(userRef, { knownStatus: 'exists' }, { displayName: value })
    }

    getWebLinksArray(profileData: UserPublicProfile): ProfileWebLink[] {
        const { websiteURL, mediumURL, twitterURL, substackURL } = profileData
        const arr: ProfileWebLink[] = []
        if (websiteURL) {
            arr.push({
                url: websiteURL,
                fileName: 'web-logo.svg',
            })
        }
        if (mediumURL) {
            arr.push({
                url: mediumURL,
                fileName: 'medium-logo.svg',
            })
        }
        if (twitterURL) {
            arr.push({
                url: twitterURL,
                fileName: 'twitter-logo.svg',
            })
        }
        if (substackURL) {
            arr.push({
                url: substackURL,
                fileName: 'substack-logo.svg',
            })
        }
        return arr
    }

    async loadUserData(userRef: UserReference): Promise<User | null> {
        const userProfileCache = new UserProfileCache({
            storage: { users: this.options.storage },
        })
        return await userProfileCache.loadUser(userRef)
    }
}
