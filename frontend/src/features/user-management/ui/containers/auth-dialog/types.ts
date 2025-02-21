import { UIEvent, UISignal } from '../../../../../main-ui/classes/logic'
import { UIElementServices } from '../../../../../services/types'
import { AuthProvider } from '../../../../../types/auth'
import { AuthError, AuthRequest } from '../../../../../services/auth/types'
import { StorageModules } from '../../../../../storage/types'
import { UITaskState } from '../../../../../main-ui/types'

export interface AuthDialogDependencies {
    services: UIElementServices<'auth' | 'overlay' | 'listKeys' | 'bluesky'>
    storage: Pick<StorageModules, 'users'>
}

export interface AuthDialogState {
    saveState: UITaskState
    mode: AuthDialogMode
    header: AuthRequest['header'] | null
    email: string
    password: string
    displayName: string
    error?: AuthError['reason']
    passwordRepeat: string
    passwordMatch: boolean
    socialLoginLoading: UITaskState
}
export type AuthDialogMode =
    | 'hidden'
    | 'register'
    | 'login'
    | 'profile'
    | 'resetPassword'
    | 'ConfirmResetPassword'

export type AuthDialogEvent = UIEvent<{
    show: null
    close: null
    toggleMode: null
    editEmail: { value: string }
    editPassword: { value: string }
    passwordRepeat: { value: string }
    passwordMatch: { value: boolean }
    emailPasswordConfirm: null
    socialSignIn: { provider: AuthProvider }

    editDisplayName: string
    confirmDisplayName: null
    passwordReset: null
    passwordResetSwitch: null
    passwordResetConfirm: null
}>

export type AuthDialogSignal = UISignal<{ type: 'auth-running' }>
