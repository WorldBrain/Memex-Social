import {
    UILogic,
    UIEventHandler,
    loadInitial,
    executeUITask,
} from '../../../../../main-ui/classes/logic'
import { UITaskState } from '../../../../../main-ui/types'
import {
    UserPublicProfile,
    User,
    UserReference,
    ProfileWebLink,
} from '../../../types'
import {
    ProfileEditModalDependencies,
    ProfileEditModalEvent,
    ProfileEditModalState,
} from './types'
import { getProfileLinks } from '../../utils'

type EventHandler<
    EventName extends keyof ProfileEditModalEvent
> = UIEventHandler<ProfileEditModalState, ProfileEditModalEvent, EventName>

const EMPTY_USER_PROFILE: UserPublicProfile = {
    websiteURL: '',
    mediumURL: '',
    twitterURL: '',
    substackURL: '',
    bio: '',
    avatarURL: '',
    paymentPointer: '',
}
export default class ProfileEditModalLogic extends UILogic<
    ProfileEditModalState,
    ProfileEditModalEvent
> {
    constructor(private dependencies: ProfileEditModalDependencies) {
        super()
    }

    userRef: UserReference | null = null

    getInitialState(): ProfileEditModalState {
        return {
            loadState: 'pristine',
            savingTaskState: 'pristine',
            user: {
                displayName: '',
            },
            userPublicProfile: EMPTY_USER_PROFILE,
            profileLinks: [],
            inputErrorArray: [],
        }
    }

    init: EventHandler<'init'> = async () => {
        await loadInitial<ProfileEditModalState>(this, async () => {
            if (!this.userRef) {
                await this._setCurrentUserReference()
            }
            if (!this.userRef) {
                return // this is purely to fix type errors - error handling is in the catch statement
            }
            const [user, userProfile] = await Promise.all([
                this.dependencies.services.userManagement.loadUserData(
                    this.userRef,
                ),
                this.dependencies.services.userManagement.loadUserPublicProfile(
                    this.userRef,
                ),
            ])
            this._setUser(user)
            this.emitMutation({
                userPublicProfile: { $set: userProfile ?? EMPTY_USER_PROFILE },
            })
            this._setWebLinksArray()
        })
    }

    saveProfile: EventHandler<'saveProfile'> = async ({ event }) => {
        await executeUITask<ProfileEditModalState>(
            this,
            'savingTaskState',
            async () => {
                await Promise.all([
                    this.dependencies.services.userManagement.updateUserPublicProfile(
                        event.profileData,
                    ),
                    this._saveDisplayName(event.displayName),
                ])
                this._setSavingTaskState('success')
                this.dependencies.onCloseRequested()
            },
        )
    }

    setDisplayName: EventHandler<'setDisplayName'> = ({ event }) => {
        this.emitMutation({
            user: {
                displayName: { $set: event.value },
            },
        })
    }

    setProfileValue: EventHandler<'setProfileValue'> = ({ event }) => {
        this.emitMutation({
            userPublicProfile: {
                [event.key]: { $set: event.value },
            },
        })
    }

    setErrorArray: EventHandler<'setErrorArray'> = ({ event }) => {
        this.emitMutation({
            inputErrorArray: { $set: event.newArray },
        })
    }

    private async _saveDisplayName(displayName: string): Promise<void> {
        await this._setCurrentUserReference()
        if (!this.userRef) {
            throw new Error(
                'Cannot find reference for current user. Please ensure user is authenticated.',
            )
        }
        await this.dependencies.services.userManagement.updateUserDisplayName(
            this.userRef,
            displayName,
        )
    }

    private async _setCurrentUserReference(): Promise<void> {
        this.userRef = this.dependencies.services.auth.getCurrentUserReference()
    }

    private _setSavingTaskState(taskState: UITaskState): void {
        this.emitMutation({ savingTaskState: { $set: taskState } })
    }

    private _setUser(user: User | null): void {
        if (!user) {
            user = {
                displayName: 'Unknown User',
            }
        }
        this.emitMutation({ user: { $set: user } })
    }

    private async _setWebLinksArray(
        profileData?: UserPublicProfile,
    ): Promise<void> {
        if (!profileData) {
            if (this.userRef) {
                profileData = await this.dependencies.services.userManagement.loadUserPublicProfile(
                    this.userRef,
                )
            } else {
                profileData = EMPTY_USER_PROFILE
            }
        }
        const profileLinks: ProfileWebLink[] = getProfileLinks(profileData)
        this.emitMutation({
            profileLinks: { $set: profileLinks },
        })
    }
}
