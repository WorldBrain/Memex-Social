import {
    UILogic,
    UIEventHandler,
    loadInitial,
} from '../../../../main-ui/classes/logic'
import { WebMonetizationEvents } from '../../service/types'
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
    curatorPaymentPointer: string | null = ''
    destroyEventHandlers = () => {}

    constructor(private dependencies: WebMonetizationButtonDependencies) {
        super()
    }

    getInitialState(): WebMonetizationButtonState {
        return {
            loadState: 'pristine',
            paymentState: 'pristine',
            isDisplayed: true,
            isMonetizationAvailable: this.dependencies.services.webMonetization
                .isAvailable,
            paymentMade: false,
            curatorPaymentPointer: '',
        }
    }

    init: EventHandler<'init'> = async () => {
        this._setupMonetizationListeners()

        await loadInitial<WebMonetizationButtonState>(this, async () => {
            this.curatorPaymentPointer = await this.dependencies.services.webMonetization.getUserPaymentPointer(
                this.dependencies.curatorUserRef,
            )
            if (!this.curatorPaymentPointer) {
                return
            }
            this.emitMutation({
                isDisplayed: { $set: true },
                curatorPaymentPointer: {
                    $set: this.curatorPaymentPointer,
                },
            })
        })
    }

    cleanup: EventHandler<'cleanup'> = () => {
        this.destroyEventHandlers()
    }

    makeSupporterPayment: EventHandler<'makeSupporterPayment'> = async () => {
        const { curatorPaymentPointer } = this
        if (!curatorPaymentPointer) {
            throw new Error('Curator does not have web monetization set up')
        }
        this.dependencies.services.webMonetization.initiatePayment(
            curatorPaymentPointer,
        )
    }

    private _setupMonetizationListeners() {
        const initiatedListener: WebMonetizationEvents['paymentInitiated'] = (
            event,
        ) => {
            if (event.paymentPointer === this.curatorPaymentPointer) {
                this.emitMutation({
                    paymentState: { $set: 'running' },
                    paymentMade: { $set: false },
                })
            }
        }

        const startListener: WebMonetizationEvents['monetizationstart'] = (
            event,
        ) => {
            if (event.paymentPointer === this.curatorPaymentPointer) {
                this.emitMutation({
                    paymentState: { $set: 'success' },
                    paymentMade: { $set: true },
                })
            }
        }
        const stopListener: WebMonetizationEvents['monetizationstop'] = (
            event,
        ) => {
            if (event.paymentPointer === this.curatorPaymentPointer) {
                this.emitMutation({
                    paymentState: { $set: 'pristine' },
                    paymentMade: { $set: false },
                })
            }
        }

        const monetizationEvents = this.dependencies.services.webMonetization
            .events
        monetizationEvents.addListener('paymentInitiated', initiatedListener)
        monetizationEvents.addListener('monetizationstart', startListener)
        monetizationEvents.addListener('monetizationstop', stopListener)
        this.destroyEventHandlers = () => {
            monetizationEvents.removeListener(
                'paymentInitiated',
                initiatedListener,
            )
            monetizationEvents.removeListener(
                'monetizationstart',
                startListener,
            )
            monetizationEvents.removeListener('monetizationstop', stopListener)
        }
    }
}
