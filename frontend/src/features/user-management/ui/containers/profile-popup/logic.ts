import { UILogic, UIEventHandler } from '../../../../../main-ui/classes/logic'
import UserPublicProfile from '../../../types'
import {
    ProfilePopupDependencies,
    ProfilePopupEvent,
    ProfilePopupState,
    TaskState,
} from './types'

type EventHandler<EventName extends keyof ProfilePopupEvent> = UIEventHandler<
    ProfilePopupState,
    ProfilePopupEvent,
    EventName
>

export default class ProfilePopupLogic extends UILogic<
    ProfilePopupState,
    ProfilePopupEvent
> {
    constructor(private dependencies: ProfilePopupDependencies) {
        super()
    }

    getInitialState(): ProfilePopupState {
        return {
            isDisplayed: false,
            isSupported: false,
            supportedTaskState: 'pristine',
            profileTaskState: 'pristine',
            profileData: {
                websiteURL: '',
                mediumURL: '',
                twitterURL: '',
                subStackURL: '',
                bio: '',
                avatarId: '',
                paymentPointer: '',
            },
        }
    }

    initProfilePopup: EventHandler<'initProfilePopup'> = async () => {
        this._setProfileTaskState('running')
        this._setDisplayState(true)
        try {
            const promises = await Promise.all([
                this.dependencies.services.userManagement.loadUserPublicProfile(
                    this.dependencies.user.id,
                ),
                this.dependencies.services.userManagement.loadIsSupported(
                    this.dependencies.user.id,
                ),
            ])
            this._setPublicProfileData(promises[0])
            this._setisSupported(promises[1])
            this._setProfileTaskState('success')
        } catch (err) {
            this._setProfileTaskState('error')
        }
    }

    initCuratorSupport: EventHandler<'initCuratorSupport'> = async () => {
        this._setSupportedTaskState('running')
        try {
            await this.dependencies.services.userManagement.toggleUserSupport(
                this.dependencies.user.id,
            )
            this._setisSupported(true)
            this._setSupportedTaskState('success')
        } catch (err) {
            this._setSupportedTaskState('error')
        }
    }

    _setProfileTaskState(taskState: TaskState) {
        this.emitMutation({ profileTaskState: { $set: taskState } })
    }

    _setDisplayState(isDisplayed: boolean) {
        this.emitMutation({ isDisplayed: { $set: isDisplayed } })
    }

    _setPublicProfileData(profileData: UserPublicProfile) {
        this.emitMutation({
            profileData: { $set: profileData },
        })
    }

    _setisSupported(isSupported: boolean) {
        this.emitMutation({
            isSupported: { $set: isSupported },
        })
    }

    _setSupportedTaskState(taskState: TaskState) {
        this.emitMutation({
            supportedTaskState: { $set: taskState },
        })
    }
}
