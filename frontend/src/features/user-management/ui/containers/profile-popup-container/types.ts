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
    services: UIElementServices<'device' | 'documentTitle' | 'logicRegistry' | 'userManagement'>
    storage: Pick<StorageModules, 'users'>
    userRef: UserReference
}

export interface ProfilePopupContainerState {
    isDisplayed: boolean
    profileTaskState: UITaskState
    user: User
    userPublicProfile: UserPublicProfile
    webLinksArray: ProfileWebLink[]
}

export type ProfilePopupContainerEvent = UIEvent<{
    initPopup: null
    hidePopup: null
    initCuratorSupport: null
}>
