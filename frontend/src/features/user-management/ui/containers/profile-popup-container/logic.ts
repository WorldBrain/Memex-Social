import { UILogic, UIEventHandler } from '../../../../../main-ui/classes/logic'
import { UITaskState } from '../../../../../main-ui/types'
import { UserPublicProfile, User, ProfileWebLink } from '../../../types'
import {
    ProfilePopupContainerDependencies,
    ProfilePopupContainerEvent,
    ProfilePopupContainerState,
} from './types'

type EventHandler<
    EventName extends keyof ProfilePopupContainerEvent
> = UIEventHandler<
    ProfilePopupContainerState,
    ProfilePopupContainerEvent,
    EventName
>

export default class ProfilePopupContainerLogic extends UILogic<
    ProfilePopupContainerState,
    ProfilePopupContainerEvent
> {
    constructor(private dependencies: ProfilePopupContainerDependencies) {
        super()
    }

    getInitialState(): ProfilePopupContainerState {
        return {
            isDisplayed: false,
            profileTaskState: 'pristine',
            user: {
                displayName: '',
            },
            userPublicProfile: {
                websiteURL: '',
                mediumURL: '',
                twitterURL: '',
                substackURL: '',
                bio: '',
                avatarURL: '',
                paymentPointer: '',
            },
            webLinksArray: [],
        }
    }

    initPopup: EventHandler<'initPopup'> = async () => {
        this._setProfileTaskState('running')
        this._setDisplayState(true)
        const { userRef } = this.dependencies
        if (!userRef) {
            return this._setProfileTaskState('error')
        }
        try {
            const promises = await Promise.all([
                this.dependencies.services.userManagement.loadUserData(userRef),
                this.dependencies.services.userManagement.loadUserPublicProfile(
                    userRef,
                ),
            ])
            this._setUser(await promises[0])
            this._setWebLinksArray(await promises[1])
            this._setUserPublicProfile(promises[1])
            this._setProfileTaskState('success')
        } catch (err) {
            this._setProfileTaskState('error')
            console.log(err)
        }
    }

    hidePopup: EventHandler<'hidePopup'> = () => {
        this._setDisplayState(false)
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

    private _setUserPublicProfile(profileData: UserPublicProfile): void {
        this.emitMutation({
            userPublicProfile: { $set: profileData },
        })
    }

    private async _setWebLinksArray(
        profileData?: UserPublicProfile,
    ): Promise<void> {
        if (!profileData) {
            if (this.dependencies.userRef) {
                profileData = await this.dependencies.services.userManagement.loadUserPublicProfile(
                    this.dependencies.userRef,
                )
            } else {
                profileData = {
                    websiteURL: '',
                    mediumURL: '',
                    twitterURL: '',
                    substackURL: '',
                    bio: '',
                    avatarURL: '',
                    paymentPointer: '',
                }
            }
        }
        const webLinksArray: ProfileWebLink[] = this.dependencies.services.userManagement.getWebLinksArray(
            profileData,
        )
        this.emitMutation({
            webLinksArray: { $set: webLinksArray },
        })
    }
}
