import { UILogic, UIEventHandler } from "../../../../../main-ui/classes/logic"
import { AuthDialogEvent, AuthDialogDependencies, AuthDialogState } from "./types"

type EventHandler<EventName extends keyof AuthDialogEvent> = UIEventHandler<AuthDialogState, AuthDialogEvent, EventName>

export default class AuthDialogLogic extends UILogic<AuthDialogState, AuthDialogEvent> {
    constructor(private dependencies: AuthDialogDependencies) {
        super()

        const { auth } = this.dependencies.services
        auth.events.on('changed', () => {
            if (auth.getCurrentUser()) {
                this._reset()
            }
        })
        auth.events.on('authRequested', () => {
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
    }

    emailPasswordSignIn: EventHandler<'emailPasswordSignIn'> = async () => {
    }

    socialSignIn: EventHandler<'socialSignIn'> = async ({ event }) => {
        await this.dependencies.services.auth.loginWithProvider(event.provider)
    }

    _show() {
        this.emitMutation({ isShown: { $set: true } })
    }

    _reset() {
        this.emitMutation({ isShown: { $set: false } })
    }
}
