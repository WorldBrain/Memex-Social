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
            curatorPaymentPointer: '',
            initialLoadTaskState: 'pristine',
            makePaymentTaskState: 'pristine',
        }
    }

    init: EventHandler<'init'> = async () => {
        this._tryDisplayComponent()
        this.dependencies.services.userManagement.events.addListener('userProfileChange',this._tryDisplayComponent)
    }

    cleanup: EventHandler<'cleanup'> = () => {
        this.dependencies.services.userManagement.events.removeAllListeners()
    }

    makeSupporterPayment: EventHandler<'makeSupporterPayment'> = async () => {
        try {
            this._setMakePaymentTaskState('running')
            const curatorPaymentPointer = await this._getPaymentPointer()
            await this.dependencies.services.webMonetization.initiatePayment(
                curatorPaymentPointer,
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

    private async _tryDisplayComponent(): Promise<void> {
        try {
            this._setInitialLoadTaskState('running')
            const shouldDisplay = await this._shouldComponentDisplay()
            this._setIsDisplayed(shouldDisplay)
            this._setInitialLoadTaskState('success')
        } catch (err) {
            console.error(err)
            this._setInitialLoadTaskState('error')
        }
    }
    
    private async _shouldComponentDisplay(): Promise<boolean> {
        const currentUserPaymentPointer = await this.dependencies.services.webMonetization.getCurrentUserPaymentPointer()
        return !!currentUserPaymentPointer
    }
    
    private async _getPaymentPointer(): Promise<string> {
        const paymentPointer = await this.dependencies.services.webMonetization.getUserPaymentPointer(
            this.dependencies.curatorUserRef
        )
        return paymentPointer
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
