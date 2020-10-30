import { UIEvent, UISignal } from "../../../../../main-ui/classes/logic";
import { UIElementServices } from "../../../../../main-ui/classes";
import { AuthProvider } from "../../../../../types/auth";

export interface AuthDialogDependencies {
    services: UIElementServices<'auth' | 'overlay'>
}

export interface AuthDialogState {
    isShown: boolean
}

export type AuthDialogEvent = UIEvent<{
    show: null
    close: null
    emailPasswordSignIn: null
    socialSignIn: { provider: AuthProvider }
}>

export type AuthDialogSignal = UISignal<
    { type: 'nothing-yet' }
>