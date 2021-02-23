import {
    UILogic,
    UIEventHandler,
    loadInitial,
    executeUITask,
} from '../../../../main-ui/classes/logic'
import { UITaskState } from '../../../../main-ui/types'
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
    constructor(private dependencies: WebMonetizationButtonDependencies) {
        super()
    }

    curatorPaymentPointer: string | null = ''

    getInitialState(): WebMonetizationButtonState {
        return {
            isDisplayed: false,
            isMonetizationAvailable: this.dependencies.services.webMonetization
                .isAvailable,
            paymentMade: false,
            curatorPaymentPointer: '',
            loadState: 'pristine',
            makePaymentTaskState: 'pristine',
        }
    }

    init: EventHandler<'init'> = async () => {
        this._setupMonetizationListeners()

        // ensure curator payment pointer is available
        await loadInitial<WebMonetizationButtonState>(this, async () => {
            this.curatorPaymentPointer = await this.dependencies.services.webMonetization.getUserPaymentPointer(
                this.dependencies.curatorUserRef,
            )
            if (!this.curatorPaymentPointer) {
                return
            }
            this.emitMutation({
                isDisplayed: { $set: !!this.curatorPaymentPointer },
                curatorPaymentPointer: {
                    $set: this.curatorPaymentPointer ?? '',
                },
            })

            // if user follows collection, initiate payment
            if (this.dependencies.isCollectionFollowed) {
                await this.dependencies.services.webMonetization.makePaymentAvailable(
                    this.curatorPaymentPointer,
                )
            }
        })
    }

    cleanup: EventHandler<'cleanup'> = () => {
        this.dependencies.services.userManagement.events.removeAllListeners()
        this.dependencies.services.webMonetization.events.removeAllListeners()
    }

    makeSupporterPayment: EventHandler<'makeSupporterPayment'> = async () => {
        const { curatorPaymentPointer } = this
        if (!curatorPaymentPointer) {
            throw new Error('Curator does not have web monetization set up')
        }
        await executeUITask<WebMonetizationButtonState>(
            this,
            'makePaymentTaskState',
            async () => {
                await this.dependencies.services.webMonetization.makePaymentAvailable(
                    curatorPaymentPointer,
                )
            },
        )
    }

    private _setupMonetizationListeners() {
        const startListener: WebMonetizationEvents['monetizationstart'] = (
            event,
        ) => {
            if (event.paymentPointer === this.curatorPaymentPointer) {
                this.emitMutation({
                    makePaymentTaskState: { $set: 'success' },
                    paymentMade: { $set: true },
                })
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
    }
}
