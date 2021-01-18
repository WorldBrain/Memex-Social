import { UIEvent } from '../../../../../main-ui/classes/logic'
import { UIElementServices } from '../../../../../main-ui/classes'
import { StorageModules } from '../../../../../storage/types'
import UserPublicProfile from '../../../types'
import { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'

export type TaskState = 'pristine' | 'success' | 'running' | 'error'

export interface ProfilePopupDependencies {
    services: UIElementServices<'userManagement'>
    storage: Pick<StorageModules, 'users'>
    user: {
        id: string | number
        displayName: string
    }
}

export interface ProfilePopupState {
    isDisplayed: boolean
    isSupported: boolean
    supportedTaskState: TaskState
    profileTaskState: TaskState
    profileData: UserPublicProfile
}

export type ProfilePopupEvent = UIEvent<{
    initProfilePopup: null
    hideProfilePopup: null
    initCuratorSupport: null
}>
