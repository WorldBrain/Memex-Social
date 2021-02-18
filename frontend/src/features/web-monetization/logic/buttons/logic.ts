import { UILogic, UIEventHandler } from '../../../../main-ui/classes/logic'
import { UITaskState } from '../../../../main-ui/types'
import {
    WebMonetizationStartEvent,
    WebMonetizationStopEvent,
    WebMonetizationEvents,
} from '../../service/types'
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

    curatorPaymentPointer: string | null = ''

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
        // ensure curator payment pointer is available
        try {
            this.curatorPaymentPointer = await this._getCuratorPaymentPointer()
        } catch (err) {
            this._setInitialLoadTaskState('error')
            return console.error(err)
        }

        if (!this.curatorPaymentPointer) {
            return this._setIsDisplayed(false)
        }

        // attach listeners
        // this._attachMonetizationListeners()
        const startListener: WebMonetizationEvents['monetizationstart'] = (
            event,
        ) => {
            console.log('webmonbut logic startListener triggered')
            console.log(event)
            if (event.paymentPointer === this.curatorPaymentPointer) {
                this._setMakePaymentTaskState('success')
                this._setPaymentMade(true)
            }
        }
        const stopListener: WebMonetizationEvents['monetizationstop'] = (
            event,
        ) => {
            if (event.paymentPointer === this.curatorPaymentPointer) {
                this.dependencies.services.webMonetization.events.removeAllListeners()
            }
        }

        this.dependencies.services.webMonetization.events.addListener(
            'monetizationstart',
            startListener,
        )
        this.dependencies.services.webMonetization.events.addListener(
            'monetizationstop',
            stopListener,
        )

        this.dependencies.services.userManagement.events.addListener(
            'userProfileChange',
            () => this._tryDisplayComponent(),
        )

        // attempt to display component (requires current user to have payment pointer)
        this._tryDisplayComponent()
        this.dependencies.services.userManagement.events.addListener(
            'userProfileChange',
            this._tryDisplayComponent,
        )

        // if user follows collection, initiate payment
        if (this.dependencies.isCollectionFollowed) {
            await this._initiatePayment()
        }
    }

    cleanup: EventHandler<'cleanup'> = () => {
        this.dependencies.services.userManagement.events.removeAllListeners()
        this.dependencies.services.webMonetization.events.removeAllListeners()
    }

    makeSupporterPayment: EventHandler<'makeSupporterPayment'> = async () => {
        await this._initiatePayment()
    }

    private _initiatePayment = async (): Promise<void> => {
        try {
            this._setMakePaymentTaskState('running')
            // this.dependencies.services.webMonetization.events.removeAllListeners()

            // ensure curator payment pointer is present
            this.curatorPaymentPointer = await this._getCuratorPaymentPointer()
            if (!this.curatorPaymentPointer) {
                throw new Error('Curator does not have web monetization set up')
            }

            // attach event listeners and trigger payment flow
            // this._attachMonetizationListeners()
            await this.dependencies.services.webMonetization.initiatePayment(
                this.curatorPaymentPointer,
            )
        } catch (err) {
            this._setMakePaymentTaskState('error')
        }
    }

    private _tryDisplayComponent = async (): Promise<void> => {
        try {
            this._setInitialLoadTaskState('running')
            const shouldDisplay = await this._shouldComponentDisplay()
            console.log('try display web mon content: ', shouldDisplay)
            this._setIsDisplayed(shouldDisplay)
            this._setInitialLoadTaskState('success')
        } catch (err) {
            console.error(err)
            this._setInitialLoadTaskState('error')
        }
    }

    private _shouldComponentDisplay = async (): Promise<boolean> => {
        const currentUserPaymentPointer = await this.dependencies.services.webMonetization.getCurrentUserPaymentPointer()
        return !!currentUserPaymentPointer && !!(document as any).monetization
    }

    private _getCuratorPaymentPointer = async (): Promise<string | null> => {
        const paymentPointer = await this.dependencies.services.webMonetization.getUserPaymentPointer(
            this.dependencies.curatorUserRef,
        )
        return paymentPointer
    }

    private _setIsDisplayed(isDisplayed: boolean): void {
        this.emitMutation({
            isDisplayed: { $set: isDisplayed },
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
