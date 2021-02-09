import { UILogic, UIEventHandler } from '../../../../main-ui/classes/logic'
import { UITaskState } from '../../../../main-ui/types'
import {
    WebMonetizationButtonDependencies,
    WebMonetizationButtonState,
    WebMonetizationButtonEvent,
} from './types'

type EventHandler<
    EventName extends keyof WebMonetizationButtonEvent
> = UIEventHandler<
    WebMonetizationButtonState,
    WebMonetizationButtonEvent,
    EventName
>

export default abstract class WebMonetizationButtonLogic extends UILogic<
    WebMonetizationButtonState,
    WebMonetizationButtonEvent
> {
    constructor(private dependencies: WebMonetizationButtonDependencies) {
        super()
    }

    getInitialState(): WebMonetizationButtonState {
        return {
            makePaymentTaskState: 'pristine',
            paymentMade: false,
        }
    }

    makeSupporterPayment: EventHandler<'makeSupporterPayment'> = async () => {
        try {
            this._setMakePaymentTaskState('running')
            this._setPaymentStatus(true)
            this._setMakePaymentTaskState('success')
        } catch (err) {
            this._setMakePaymentTaskState('error')
        }
    }

    _setPaymentStatus(paymentMade: boolean) {
        this.emitMutation({
            paymentMade: { $set: paymentMade },
        })
    }

    _setMakePaymentTaskState(taskState: UITaskState) {
        this.emitMutation({
            makePaymentTaskState: { $set: taskState },
        })
    }
}
