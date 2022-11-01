import {
    UILogic,
    UIEventHandler,
    loadInitial,
} from '../../../../../main-ui/classes/logic'
import {
    ProfilePopupContainerDependencies,
    ProfilePopupContainerEvent,
    ProfilePopupContainerState,
} from './types'
import { getProfileLinks } from '../../utils'

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
            loadState: 'pristine',
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
                paymentPointer: '$ilp.uphold.com/zHjHFKyUWbwB',
            },
            profileLinks: [],
        }
    }

    initPopup: EventHandler<'initPopup'> = async (incoming) => {
        const { userRef } = this.dependencies
        if (!userRef) {
            return
        }

        this.emitMutation({ isDisplayed: { $set: true } })

        const loadState = incoming.previousState.loadState
        if (!(loadState === 'pristine' || loadState === 'error')) {
            return
        }

        await loadInitial<ProfilePopupContainerState>(this, async () => {
            const [user, userProfile] = await Promise.all([
                this.dependencies.services.userManagement.loadUserData(userRef),
                this.dependencies.services.userManagement.loadUserPublicProfile(
                    userRef,
                ),
            ])
            this.emitMutation({
                user: {
                    displayName: { $set: user?.displayName ?? 'Unknown user' },
                },
                userPublicProfile: { $set: userProfile },
                profileLinks: {
                    $set: userProfile ? getProfileLinks(userProfile) : [],
                },
            })
        })
    }

    hidePopup: EventHandler<'hidePopup'> = () => {
        this.emitMutation({ isDisplayed: { $set: false } })
    }
}
