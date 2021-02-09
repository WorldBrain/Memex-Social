import { UIEvent } from '../../../../main-ui/classes/logic'
import { UIElementServices } from '../../../../main-ui/classes'
import { StorageModules } from '../../../../storage/types'
import { UITaskState } from '../../../../main-ui/types'

export interface CuratorSupportButtonBlockDependencies {
    services: UIElementServices<'userManagement'>
    storage: Pick<StorageModules, 'users'>
    paymentPointer: string
}

export interface CuratorSupportButtonBlockState {
    makePaymentTaskState: UITaskState
    paymentMade: boolean
}

export type CuratorSupportButtonBlockEvent = UIEvent<{
    makeSupporterPayment: null
}>
