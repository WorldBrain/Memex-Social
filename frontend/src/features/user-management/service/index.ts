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

    getWebLinksArray(profileData: UserPublicProfile): ProfileWebLink[] {
        const { websiteURL, mediumURL, twitterURL, subStackURL } = profileData
        const arr: ProfileWebLink[] = []
        if (websiteURL) {
            arr.push({
                url: websiteURL,
                iconPath: 'img/websiteIcon.svg',
            })
        }
        if (mediumURL) {
            arr.push({
                url: mediumURL,
                iconPath: 'img/mediumIcon.svg',
            })
        }
        if (twitterURL) {
            arr.push({
                url: twitterURL,
                iconPath: 'img/twitterIcon.svg',
            })
        }
        if (subStackURL) {
            arr.push({
                url: subStackURL,
                iconPath: 'img/substackIcon.svg',
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
