import { UIEvent, UISignal } from "../../../../../main-ui/classes/logic";
import { UIElementServices } from "../../../../../main-ui/classes";
import { User } from "@worldbrain/memex-common/lib/web-interface/types/users";

export interface AuthHeaderDependencies {
    services: UIElementServices<'auth' | 'overlay'>
}

export interface AuthHeaderState {
    user: Pick<User, 'displayName'> | null
    showMenu: boolean
}

export type AuthHeaderEvent = UIEvent<{
    toggleMenu: null
    hideMenu: null
    showSettings: null
    login: null
    logout: null
}>

export type AuthHeaderSignal = UISignal<
    { type: 'nothing-yet' }
>