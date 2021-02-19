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
            paymentMade: false,
            curatorPaymentPointer: '',
            loadState: 'pristine',
            makePaymentTaskState: 'pristine',
        }
    }

    init: EventHandler<'init'> = async () => {
        // ensure curator payment pointer is available
        await loadInitial<WebMonetizationButtonState>(this, async () => {
            this.curatorPaymentPointer = await this.dependencies.services.webMonetization.getUserPaymentPointer(
                this.dependencies.curatorUserRef,
            )
            if (!this.curatorPaymentPointer) {
                return
            }
            this.emitMutation({
                isDisplayed: { $set: await this._shouldComponentDisplay() },
                curatorPaymentPointer: {
                    $set: this.curatorPaymentPointer ?? '',
                },
            })
        })

        this._setupMonetizationListeners()

        // attempt to display component (requires current user to have payment pointer)
        this.dependencies.services.userManagement.events.addListener(
            'userProfileChange',
            async () =>
                this.emitMutation({
                    isDisplayed: { $set: await this._shouldComponentDisplay() },
                }),
        )

        // if user follows collection, initiate payment
        if (this.dependencies.isCollectionFollowed) {
            await this._makePaymentAvailable()
        }
    }

    cleanup: EventHandler<'cleanup'> = () => {
        this.dependencies.services.userManagement.events.removeAllListeners()
        this.dependencies.services.webMonetization.events.removeAllListeners()
    }

    makeSupporterPayment: EventHandler<'makeSupporterPayment'> = async () => {
        await this._makePaymentAvailable()
    }

    private _makePaymentAvailable = async (): Promise<void> => {
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

    private _shouldComponentDisplay = async (): Promise<boolean> => {
        const { webMonetization } = this.dependencies.services
        const currentUserPaymentPointer = await webMonetization.getCurrentUserPaymentPointer()
        return !!currentUserPaymentPointer && webMonetization.isAvailable
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
