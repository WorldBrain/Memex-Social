import { UILogic, UIEventHandler } from "../../../../../main-ui/classes/logic"
import { AuthHeaderEvent, AuthHeaderDependencies, AuthHeaderState } from "./types"

type EventHandler<EventName extends keyof AuthHeaderEvent> = UIEventHandler<AuthHeaderState, AuthHeaderEvent, EventName>

export default class AuthHeaderLogic extends UILogic<AuthHeaderState, AuthHeaderEvent> {
    constructor(private dependencies: AuthHeaderDependencies) {
        super()

        const { auth } = this.dependencies.services
        auth.events.on('changed', () => {
            this.emitMutation({ user: { $set: auth.getCurrentUser() } })
        })
    }

    getInitialState(): AuthHeaderState {
        return {
            user: this.dependencies.services.auth.getCurrentUser(),
            // user: { displayName: 'bla' },
            showMenu: false,
            // showMenu: true,
        }
    }

    init: EventHandler<'init'> = async () => {

    }

    toggleMenu: EventHandler<'toggleMenu'> = () => {
        return { $toggle: ['showMenu'] }
    }

    hideMenu: EventHandler<'hideMenu'> = () => {
        return { showMenu: { $set: false } }
    }

    showSettings: EventHandler<'showSettings'> = async () => {

    }

    login: EventHandler<'login'> = async () => {
        this.dependencies.services.auth.requestAuth({ reason: 'login-requested' })
    }

    logout: EventHandler<'logout'> = async () => {

    }
}
