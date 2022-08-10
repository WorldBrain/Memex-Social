import { UIEvent, UISignal } from '../../../../../main-ui/classes/logic'
import { UIElementServices } from '../../../../../services/types'
import { User } from '@worldbrain/memex-common/lib/web-interface/types/users'
import { StorageModules } from '../../../../../storage/types'
import { UITaskState } from '../../../../../main-ui/types'

export interface AuthHeaderDependencies {
    services: UIElementServices<'auth' | 'overlay' | 'userManagement'>
    storage: Pick<StorageModules, 'users'>
}

export interface AuthHeaderState {
    loadState: UITaskState
    user: Pick<User, 'displayName'> | null
    showMenu: boolean
    showSettings: boolean
    showAccountSettings: boolean
    isMemexInstalled: boolean
}

export type AuthHeaderEvent = UIEvent<{
    toggleMenu: null
    hideMenu: null
    showSettings: null
    hideSettings: null
    showAccountSettings: null
    hideAccountSettings: null
    login: null
    logout: null
}>

export type AuthHeaderSignal = UISignal<{ type: 'nothing-yet' }>
