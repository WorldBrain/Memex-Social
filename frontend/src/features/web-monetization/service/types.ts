import TypedEventEmitter from 'typed-emitter'
import { UserReference } from '../../user-management/types'
import * as browserTypes from '../wm-types'

export interface WebMonetizationEvents {
    monetizationstart(event: WebMonetizationStartEvent): void
    monetizationstop(event: WebMonetizationStopEvent): void
}

export type WebMonetizationStartEvent = Pick<
    browserTypes.WebMonetizationStartEvent['detail'],
    'paymentPointer' | 'requestId'
>
export type WebMonetizationStopEvent = Pick<
    browserTypes.WebMonetizationStopEvent['detail'],
    'paymentPointer' | 'requestId' | 'finalized'
>

export interface WebMonetizationService {
    events: TypedEventEmitter<WebMonetizationEvents>

    getUserPaymentPointer(userRef: UserReference): Promise<string | null>
    getCurrentUserPaymentPointer(): Promise<string | null>
    makePaymentAvailable(paymentPointer: string): void
}
