import {
    ProfileWebLink,
    User,
    UserPublicProfile,
    UserReference,
} from '../types'
import { AuthService } from '../../../services/auth/types'
import UserStorage from '../storage/'
import UserProfileCache from '../utils/user-profile-cache'
import TypedEventEmitter from 'typed-emitter'
import { EventEmitter } from 'events'

interface UserManagementEvents {
    userProfileChange(): void
}

export default class UserManagementService {
    constructor(
        private options: {
            auth: AuthService
            storage: UserStorage
        },
    ) {}

    events: TypedEventEmitter<UserManagementEvents> = new EventEmitter()
    userPublicProfilesCache: { [id: string]: UserPublicProfile } = {}

    private _updateCache(userRef: UserReference, profileData: UserPublicProfile) {
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

    /**
     * This method takes a param profileData and updates collections.userPublicProfile
     * for the current user with this object
     * @param profileData Object of type UserPublicProfile with updated profile data
     */
    async updateUserPublicProfile(
        profileData: UserPublicProfile,
    ): Promise<void> {
        try {
            const userRef = await this.options.auth.getCurrentUserReference()
            if (!userRef) {
                console.error('Please login')
                return
            }
            await this.options.storage.createOrUpdateUserPublicProfile(
                userRef,
                { knownStatus: 'exists' },
                profileData,
            )
            this._updateCache(userRef, profileData)
            this.events.emit('userProfileChange')
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

    getWebLinksArray(profileData: UserPublicProfile): ProfileWebLink[] {
        const { websiteURL, mediumURL, twitterURL, substackURL } = profileData
        const arr: ProfileWebLink[] = []
        if (websiteURL) {
            arr.push({
                label: 'Website',
                urlPropName: 'websiteURL',
                url: websiteURL,
                fileName: 'web-logo.svg',
            })
        }
        if (mediumURL) {
            arr.push({
                label: 'Medium',
                urlPropName: 'mediumURL',
                url: mediumURL,
                fileName: 'medium-logo.svg',
            })
        }
        if (twitterURL) {
            arr.push({
                label: 'Twitter',
                urlPropName: 'twitterURL',
                url: twitterURL,
                fileName: 'twitter-logo.svg',
            })
        }
        if (substackURL) {
            arr.push({
                label: 'Substack',
                urlPropName: 'substackURL',
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
