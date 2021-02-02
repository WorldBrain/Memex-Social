import { UIEvent } from '../../../../../main-ui/classes/logic'
import { UITaskState } from '../../../../../main-ui/types'
import { UIElementServices } from '../../../../../main-ui/classes'
import { StorageModules } from '../../../../../storage/types'
import { ProfilePopupContainerState } from '../profile-popup-container/types'
import { UserPublicProfile } from '../../../types'

export type ProfileEditModalDependencies = {
    services: UIElementServices<'userManagement' | 'auth'>
    storage: Pick<StorageModules, 'users'>
}

export type ProfileEditModalState = Omit<ProfilePopupContainerState,'isSupported' | 'supportedTaskState'>&{
    savingTaskState: UITaskState
    inputErrorArray: boolean[]
}

export type ProfileEditModalEvent = UIEvent<{
    hidePopup: null
    saveUserPublicProfile: {
        profileData: UserPublicProfile
        displayName: string
    }
    setProfileValue: {
        key: keyof UserPublicProfile
        value: string
    }
    setDisplayName: { value: string }
    setErrorArray: { newArray: boolean[] }
}>