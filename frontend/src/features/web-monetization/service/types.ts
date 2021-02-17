import TypedEventEmitter from "typed-emitter";
import { UserReference } from "../../user-management/types";

export interface WebMonetizationEvents {
    monetizationstart(event: CustomEvent<WebMonetizationStartEvent>): void
    monetizationstop(event: CustomEvent<WebMonetizationStopEvent>): void
}

type WebMonetizationEventDetailBase = {
    paymentPointer: string
    requestId: string
}

export type WebMonetizationStartEvent = WebMonetizationEventDetailBase

export type WebMonetizationStopEvent = WebMonetizationEventDetailBase & {
        finalized: boolean
    }

export interface WebMonetizationService {
    events: TypedEventEmitter<WebMonetizationEvents>

    getUserPaymentPointer(userRef: UserReference): Promise<string | null>
    getCurrentUserPaymentPointer(): Promise<string | null>
    initiatePayment(paymentPointer: string): void

}