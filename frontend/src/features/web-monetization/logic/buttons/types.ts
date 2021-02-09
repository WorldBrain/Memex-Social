import { UIEvent } from '../../../../main-ui/classes/logic'
import { UIElementServices } from '../../../../main-ui/classes'
import { StorageModules } from '../../../../storage/types'
import { UITaskState } from '../../../../main-ui/types'

export interface WebMonetizationButtonDependencies {
    services: UIElementServices<'userManagement'>
    storage: Pick<StorageModules, 'users'>
    paymentPointer: string
}

export interface WebMonetizationButtonState {
    makePaymentTaskState: UITaskState
    paymentMade: boolean
}

export type WebMonetizationButtonEvent = UIEvent<{
    makeSupporterPayment: null
}>
