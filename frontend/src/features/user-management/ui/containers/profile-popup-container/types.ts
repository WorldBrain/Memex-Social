import { UIEvent } from '../../../../../main-ui/classes/logic'
import { UIElementServices } from '../../../../../main-ui/classes'
import { StorageModules } from '../../../../../storage/types'
import {
    UserReference,
    UserPublicProfile,
    User,
    ProfileWebLink,
} from '../../../types'
import { UITaskState } from '../../../../../main-ui/types'

export interface ProfilePopupContainerDependencies {
    services: UIElementServices<'userManagement'>
    storage: Pick<StorageModules, 'users'>
    userRef: UserReference
}

export interface ProfilePopupContainerState {
    isDisplayed: boolean
    isSupported: boolean
    supportedTaskState: UITaskState
    profileTaskState: UITaskState
    user: User
    profileData: UserPublicProfile
    webLinksArray: ProfileWebLink[]
}

export type ProfilePopupContainerEvent = UIEvent<{
    initPopup: null
    hidePopup: null
    initCuratorSupport: null
}>
