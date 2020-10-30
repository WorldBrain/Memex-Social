import { UILogic, UIEventHandler } from "../../../../../main-ui/classes/logic"
import { AuthDialogEvent, AuthDialogDependencies, AuthDialogState } from "./types"
import { AuthResult } from "../../../../../services/auth/types"

type EventHandler<EventName extends keyof AuthDialogEvent> = UIEventHandler<AuthDialogState, AuthDialogEvent, EventName>

export default class AuthDialogLogic extends UILogic<AuthDialogState, AuthDialogEvent> {
    emitAuthResult?: (result: AuthResult) => void

    constructor(private dependencies: AuthDialogDependencies) {
        super()

        const { auth } = this.dependencies.services
        auth.events.on('changed', () => {
            if (auth.getCurrentUser()) {
                this._reset()
            }
        })
        auth.events.on('authRequested', (event) => {
            this.emitAuthResult = event.emitResult
            this._show()
        })
    }

    getInitialState(): AuthDialogState {
        return {
            isShown: false
        }
    }

    init: EventHandler<'init'> = async () => {

    }

    show: EventHandler<'show'> = async () => {
        this._show()
    }

    close: EventHandler<'close'> = async () => {
        this._reset()
        this._result({ status: 'cancelled' })
    }

    emailPasswordSignIn: EventHandler<'emailPasswordSignIn'> = async () => {
    }

    socialSignIn: EventHandler<'socialSignIn'> = async ({ event }) => {
        const { result } = await this.dependencies.services.auth.loginWithProvider(event.provider)
        this._result(result)
    }

    _show() {
        this.emitMutation({ isShown: { $set: true } })
    }

    _reset() {
        this.emitMutation({ isShown: { $set: false } })
    }

    _result(result: AuthResult) {
        this.emitAuthResult?.(result)
        delete this.emitAuthResult
    }
}
