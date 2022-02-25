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
            isDisplayed: false,
            isMonetizationAvailable: this.dependencies.services.webMonetization
                .isAvailable,
            paymentMade: false,
            curatorPaymentPointer: '',
        }
    }

    init: EventHandler<'init'> = async () => {
        this._setupMonetizationListeners()

        console.log('test', this.dependencies.isFollowedSpace)

        await loadInitial<WebMonetizationButtonState>(this, async () => {
            this.curatorPaymentPointer = await this.dependencies.services.webMonetization.getUserPaymentPointer(
                this.dependencies.curatorUserRef,
            )
            if (!this.curatorPaymentPointer) {
                this.emitMutation({
                    curatorPaymentPointer: {
                        $set: '$ilp.uphold.com/zHjHFKyUWbwB',
                    },
                })
            }
            this.emitMutation({
                curatorPaymentPointer: {
                    $set: this.curatorPaymentPointer,
                },
            })
        })

        if (this.dependencies.isFollowedSpace) {
            const { curatorPaymentPointer } = this
            if (!curatorPaymentPointer) {
                this.dependencies.services.webMonetization.initiatePayment(
                    '$ilp.uphold.com/zHjHFKyUWbwB',
                )
            } else {
                this.dependencies.services.webMonetization.initiatePayment(
                    curatorPaymentPointer,
                )
            }
        }
    }

    showPopup: EventHandler<'showPopup'> = async () => {
        this.emitMutation({
            isDisplayed: { $set: true },
        })
    }

    hidePopup: EventHandler<'hidePopup'> = async () => {
        this.emitMutation({
            isDisplayed: { $set: false },
        })
    }

    cleanup: EventHandler<'cleanup'> = () => {
        this.destroyEventHandlers()
    }

    makeSupporterPayment: EventHandler<'makeSupporterPayment'> = async () => {
        const { curatorPaymentPointer } = this
        if (!curatorPaymentPointer) {
            this.dependencies.services.webMonetization.initiatePayment(
                '$ilp.uphold.com/zHjHFKyUWbwB',
            )
        } else {
            this.dependencies.services.webMonetization.initiatePayment(
                curatorPaymentPointer,
            )
        }
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
                    paymentState: { $set: 'running' },
                    paymentMade: { $set: false },
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

        const progressListener: WebMonetizationEvents['monetizationprogress'] = (
            event,
        ) => {
            this.emitMutation({
                paymentState: { $set: 'success' },
                paymentMade: { $set: false },
            })
        }

        const monetizationEvents = this.dependencies.services.webMonetization
            .events
        monetizationEvents.addListener('paymentInitiated', initiatedListener)
        monetizationEvents.addListener('monetizationstart', startListener)
        monetizationEvents.addListener('monetizationstop', stopListener)
        monetizationEvents.addListener('monetizationprogress', progressListener)
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
