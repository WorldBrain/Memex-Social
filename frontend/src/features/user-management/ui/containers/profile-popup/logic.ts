import { getUserReference } from '@worldbrain/memex-common/ts/user-management/utils'
import { UILogic, UIEventHandler } from '../../../../../main-ui/classes/logic'
import { UITaskState } from '../../../../../main-ui/types'
import {
    UserPublicProfile,
    User,
    UserReference,
    ProfileWebLink,
} from '../../../types'
import {
    ProfilePopupDependencies,
    ProfilePopupEvent,
    ProfilePopupState,
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
            user: {
                displayName: '',
            },
            profileData: {
                websiteURL: '',
                mediumURL: '',
                twitterURL: '',
                subStackURL: '',
                bio: '',
                avatarUrl: '',
                paymentPointer: '',
            },
            webLinksArray: [],
        }
    }

    initPopup: EventHandler<'initPopup'> = async () => {
        this._setProfileTaskState('running')
        this._setDisplayState(true)
        const { userRef } = this.dependencies
        try {
            const promises = await Promise.all([
                this.dependencies.services.userManagement.loadUserData(userRef),
                this.dependencies.services.userManagement.loadUserPublicProfile(
                    userRef,
                ),
            ])
            this._setUser(await promises[0])
            this._setWebLinksArray(await promises[1])
            this._setPublicProfileData(promises[1])
            this._setProfileTaskState('success')
        } catch (err) {
            this._setProfileTaskState('error')
        }
    }

    hidePopup: EventHandler<'hidePopup'> = () => {
        this._setDisplayState(false)
    }

    private _setProfileTaskState(taskState: UITaskState) {
        this.emitMutation({ profileTaskState: { $set: taskState } })
    }

    private _setDisplayState(isDisplayed: boolean) {
        this.emitMutation({ isDisplayed: { $set: isDisplayed } })
    }

    private _setUser(user: User | null) {
        if (!user) {
            user = {
                displayName: 'Unknown User',
            }
        }
        this.emitMutation({ user: { $set: user } })
    }

    private _setPublicProfileData(profileData: UserPublicProfile) {
        this.emitMutation({
            profileData: { $set: profileData },
        })
    }

    private _setWebLinksArray(profileData: UserPublicProfile) {
        const webLinksArray: ProfileWebLink[] = this.dependencies.services.userManagement.getWebLinksArray(
            profileData,
        )
        this.emitMutation({
            webLinksArray: { $set: webLinksArray },
        })
    }
}
