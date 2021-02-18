import WebMonetizationBase from '../'

export default class MemoryWebMonetizationService extends WebMonetizationBase {
    initiatePayment(paymentPointer: string): void {
        this.events.emit('monetizationstart', {
            paymentPointer,
            requestId: 'bar',
        })
        setTimeout(() => {
            this.events.emit('monetizationstop', {
                paymentPointer,
                requestId: 'bar',
                finalized: true,
            })
        }, 1000)
    }
}
