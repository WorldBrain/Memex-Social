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
            isDisplayed: false,
            paymentMade: false,
            initialLoadTaskState: 'pristine',
            makePaymentTaskState: 'pristine',
        }
    }

    init: EventHandler<'init'> = async () => {
        try {
            this._setInitialLoadTaskState('running')
            const shouldDisplay = await this.shouldComponentDisplay()
            this._setIsDisplayed(shouldDisplay)
            this._setInitialLoadTaskState('success')
        } catch (err) {
            console.error(err)
            this._setInitialLoadTaskState('error')
        }
    }

    makeSupporterPayment: EventHandler<'makeSupporterPayment'> = async () => {
        try {
            this._setMakePaymentTaskState('running')
            await this.dependencies.services.webMonetization.initiatePayment(
                this.dependencies.paymentPointer, 
                (taskState: UITaskState) => {
                    if(taskState === 'success') {
                        this._setPaymentMade(true)
                    }
                    this._setMakePaymentTaskState(taskState)
                }
            )
        } catch (err) {
            this._setMakePaymentTaskState('error')
        }
    }

    private async shouldComponentDisplay(): Promise<boolean> {
        const currentUserPaymentPointer = await this.dependencies.services.webMonetization.getCurrentUserPaymentPointer()
        return !!currentUserPaymentPointer
    }

    private async _setIsDisplayed(isDisplayed: boolean): Promise<void> {
        
        this.emitMutation({
            isDisplayed: { $set: isDisplayed }
        })
    }

    private _setPaymentMade(paymentMade: boolean) {
        this.emitMutation({
            paymentMade: { $set: paymentMade },
        })
    }

    private _setInitialLoadTaskState(taskState: UITaskState) {
        this.emitMutation({
            initialLoadTaskState: { $set: taskState },
        })
    }

    private _setMakePaymentTaskState(taskState: UITaskState) {
        this.emitMutation({
            makePaymentTaskState: { $set: taskState },
        })
    }
}
