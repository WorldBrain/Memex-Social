import TypedEventEmitter from "typed-emitter";
import { UserReference } from "../../user-management/types";

export interface WebMonetizationEvents {
    webMonetizationStart(event: WebMonetizationStartEvent): void
    webMonetizationStop(event: WebMonetizationStopEvent): void
}

type WebMonetizationEventDetailBase = {
    paymentPointer: string
    requestId: string
}

export type WebMonetizationStartEvent = {
    detail: WebMonetizationEventDetailBase
}

export type WebMonetizationStopEvent = {
    detail: WebMonetizationEventDetailBase &
    {
        finalized: boolean
    }
}

export interface WebMonetizationService {
    events: TypedEventEmitter<WebMonetizationEvents>

    getUserPaymentPointer(userRef: UserReference): Promise<string | void>
    getCurrentUserPaymentPointer(): Promise<string | null>
    initiatePayment(paymentPointer: string): void
    
}