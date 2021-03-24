import { UIEvent, UISignal } from '../../../../../main-ui/classes/logic'
import { UIElementServices } from '../../../../../services/types'
import { StorageModules } from '../../../../../storage/types'
import { UITaskState } from '../../../../../main-ui/types'

export interface UnseenActivityIndicatorDependencies {
    services: UIElementServices<'activityStreams' | 'auth'>
    storage: Pick<StorageModules, 'activityStreams'>
}

export type UnseenActivityIndicatorState = {
    loadState: UITaskState
    isAuthenticated?: boolean
    hasUnseen?: boolean
}

export type UnseenActivityIndicatorEvent = UIEvent<{}>

export type UnseenActivityIndicatorSignal = UISignal<{ type: 'not-yet' }>
