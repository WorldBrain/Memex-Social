import { UIEvent } from '../../../../../main-ui/classes/logic'
import { UIElementServices } from '../../../../../services/types'
import {
    UserReference,
    UserPublicProfile,
    User,
    ProfileWebLink,
} from '../../../types'
import { UITaskState } from '../../../../../main-ui/types'

export interface ProfilePopupContainerDependencies {
    services: UIElementServices<
        'device' | 'documentTitle' | 'logicRegistry' | 'userManagement'
    >
    userRef: UserReference | null
    children: React.ReactNode
}

export interface ProfilePopupContainerState {
    isDisplayed: boolean
    loadState: UITaskState
    user: User
    userPublicProfile: UserPublicProfile | null
    profileLinks: ProfileWebLink[]
}

export type ProfilePopupContainerEvent = UIEvent<{
    initPopup: null
    hidePopup: null
    initCuratorSupport: null
}>
