import type { StorageModules } from '../../../storage/types'
import type { UIElementServices } from '../../../services/types'
import type { UIEvent } from '../../classes/logic'

export type LandingPageEvent = UIEvent<{
    toggle: {}
}>

export interface LandingPageDependencies {
    services: UIElementServices<
        | 'auth'
        | 'overlay'
        | 'router'
        | 'webMonetization'
        | 'localStorage'
        | 'documentTitle'
    >
    storage: Pick<StorageModules, 'contentSharing'>
}
