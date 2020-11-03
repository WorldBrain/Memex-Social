import { UIEvent, UISignal } from "../../../../../main-ui/classes/logic";
import { UIElementServices } from "../../../../../main-ui/classes";
import { AuthProvider } from "../../../../../types/auth";
import { AuthError } from "../../../../../services/auth/types";
import { StorageModules } from "../../../../../storage/types";
import { UITaskState } from "../../../../../main-ui/types";

export interface AuthDialogDependencies {
    services: UIElementServices<'auth' | 'overlay'>
    storage: Pick<StorageModules, 'users'>
}

export interface AuthDialogState {
    saveState: UITaskState
    mode: AuthDialogMode
    email: string
    password: string
    displayName: string
    error?: AuthError['reason']
}
export type AuthDialogMode = 'hidden' | 'register' | 'login' | 'profile';

export type AuthDialogEvent = UIEvent<{
    show: null
    close: null
    toggleMode: null
    editEmail: { value: string }
    editPassword: { value: string }
    emailPasswordConfirm: null
    socialSignIn: { provider: AuthProvider }

    editDisplayName: { value: string }
    confirmDisplayName: null
}>

export type AuthDialogSignal = UISignal<
    { type: 'auth-running' }
>