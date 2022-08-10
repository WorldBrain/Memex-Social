import { UIEvent } from '../../../../main-ui/classes/logic'
import { UIElementServices } from '../../../../services/types'
import { StorageModules } from '../../../../storage/types'
import { UITaskState } from '../../../../main-ui/types'
import { UserReference } from '../../../user-management/types'

export interface WebMonetizationButtonDependencies {
    services: UIElementServices<
        'userManagement' | 'webMonetization' | 'documentTitle'
    >
    storage: Pick<StorageModules, 'users'>
    curatorUserRef: UserReference
    isFollowedSpace?: boolean
}

export interface WebMonetizationButtonState {
    loadState: UITaskState
    paymentState: UITaskState
    isDisplayed: boolean
    isMonetizationAvailable: boolean
    paymentMade: boolean
    curatorPaymentPointer: string
}

export type WebMonetizationButtonEvent = UIEvent<{
    makeSupporterPayment: null
    showPopup: null
    hidePopup: null
}>
