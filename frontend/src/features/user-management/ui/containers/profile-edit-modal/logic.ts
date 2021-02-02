import { UILogic, UIEventHandler } from '../../../../../main-ui/classes/logic'
import { UITaskState } from '../../../../../main-ui/types'
import { UserPublicProfile, User, UserReference } from '../../../types'
import {
    ProfileEditModalDependencies,
    ProfileEditModalEvent,
    ProfileEditModalState,
} from './types'

type EventHandler<
    EventName extends keyof ProfileEditModalEvent
> = UIEventHandler<
    ProfileEditModalState,
    ProfileEditModalEvent,
    EventName
>

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
            isDisplayed: false,
            profileTaskState: 'pristine',
            savingTaskState: 'pristine',
            user: {
                displayName: '',
            },
            profileData: {
                websiteURL: '',
                mediumURL: '',
                twitterURL: '',
                substackURL: '',
                bio: '',
                avatarURL: '',
                paymentPointer: '',
            },
            webLinksArray: [],
            inputErrorArray: []
        }
    }

    init: EventHandler<'init'> = async () => {
        this._setProfileTaskState('running')
        this._setDisplayState(true)
        
        try {
            if(!this.userRef) {
                await this._setCurrentUserReference()
            }
            if (!this.userRef) {
                return // this is purely to fix type errors - error handling is in the catch statement
            }
            const promises = await Promise.all([
                this.dependencies.services.userManagement.loadUserData(this.userRef),
                this.dependencies.services.userManagement.loadUserPublicProfile(
                    this.userRef,
                ),
            ])
            this._setUser(await promises[0])
            this._setPublicProfileData(promises[1])
            this._setProfileTaskState('success')
        } catch (err) {
            this._setProfileTaskState('error')
        }
    }

    saveUserPublicProfile: EventHandler<'saveUserPublicProfile'> = async ({event}) => {
        this._setSavingTaskState('running')
        if(!this.userRef) {
            try {
                await this._setCurrentUserReference()
            } catch (err) {
                this._setSavingTaskState('error')
            }
        }
        if (!this.userRef) {
            return this._setSavingTaskState('error')
        }
        try {
            await Promise.all([
                this.dependencies.services.userManagement.updateUserPublicProfile(this.userRef, event.profileData),
                this._saveDisplayName(event.displayName)
            ])
            this._setSavingTaskState('success')
        } catch (err) {
            this._setSavingTaskState('error')
        }
    }

    setDisplayName: EventHandler<'setDisplayName'> = ({event}) => {
        this.emitMutation({
            user: {
                displayName: { $set: event.value }
            }
        })
    }

    setProfileValue: EventHandler<'setProfileValue'> = ({event}) => {
        this.emitMutation({
            profileData: {
                [event.key]: { $set: event.value }
            }
        })
    }

    setErrorArray: EventHandler<'setErrorArray'> = ({event}) => {
        this.emitMutation({
            inputErrorArray: { $set: event.newArray }
        })
    }

    hidePopup: EventHandler<'hidePopup'> = () => {
        this._setDisplayState(false)
    }

    private async _saveDisplayName(displayName: string): Promise<void> {
        await this._setCurrentUserReference()
        if (!this.userRef) {
            throw new Error('Cannot find reference for current user. Please ensure user is authenticated.')
        }
        await this.dependencies.services.userManagement.updateUserDisplayName(this.userRef, displayName)
    }

    private async _setCurrentUserReference(): Promise<void> {
        this.userRef = await this.dependencies.services.auth.getCurrentUserReference()
    }

    private _setSavingTaskState(taskState: UITaskState): void {
        this.emitMutation({ savingTaskState: { $set: taskState } })
    }

    private _setProfileTaskState(taskState: UITaskState): void {
        this.emitMutation({ profileTaskState: { $set: taskState } })
    }

    private _setDisplayState(isDisplayed: boolean): void {
        this.emitMutation({ isDisplayed: { $set: isDisplayed } })
    }

    private _setUser(user: User | null): void {
        if (!user) {
            user = {
                displayName: 'Unknown User',
            }
        }
        this.emitMutation({ user: { $set: user } })
    }

    private _setPublicProfileData(profileData: UserPublicProfile): void {
        this.emitMutation({
            profileData: { $set: profileData },
        })
    }
}
