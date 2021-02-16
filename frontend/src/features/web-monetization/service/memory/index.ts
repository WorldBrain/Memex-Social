import WebMonetizationBase from "../";

export default class MemoryWebMonetizationService extends WebMonetizationBase {
    initiatePayment(paymentPointer: string): void {
        this.events.emit('webMonetizationStart', {detail: {paymentPointer, requestId: 'bar'}})
        setTimeout(() => {
            this.events.emit('webMonetizationStop', {detail: {paymentPointer, requestId: 'bar', finalized: true}})
        }, 1000);
    }
}