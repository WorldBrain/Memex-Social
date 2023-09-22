import { UIEvent } from '../../../../../main-ui/classes/logic'
import { UITaskState } from '../../../../../main-ui/types'
import { UIElementServices } from '../../../../../services/types'
import { ProfilePopupContainerState } from '../profile-popup-container/types'
import { UserPublicProfile } from '../../../types'

export type ProfileEditModalDependencies = {
    services: UIElementServices<'userManagement' | 'auth' | 'overlay'>
    onCloseRequested: () => void
}

export type ProfileEditModalState = Omit<
    ProfilePopupContainerState,
    'isDisplayed'
> & {
    savingTaskState: UITaskState
    inputErrorArray: boolean[]
    email: string
    showEmailEditButton: boolean
    emailEditSuccess: UITaskState
    passwordResetSent: boolean
    passwordResetSuccessful: boolean
}

export type ProfileEditModalEvent = UIEvent<{
    saveProfile: {
        profileData: UserPublicProfile
        displayName: string
    }
    setProfileValue: {
        key: keyof UserPublicProfile
        value: string
    }
    setDisplayName: { value: string }
    setEmail: { value: string }
    setErrorArray: { newArray: boolean[] }
    confirmEmailChange: { value: string }
    sendPasswordResetEmail: { value: string }
}>
