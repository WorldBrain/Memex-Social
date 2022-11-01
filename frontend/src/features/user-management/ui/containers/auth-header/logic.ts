import {
    UILogic,
    UIEventHandler,
    loadInitial,
} from '../../../../../main-ui/classes/logic'
import { isMemexInstalled } from '../../../../../utils/memex-installed'
import {
    AuthHeaderEvent,
    AuthHeaderDependencies,
    AuthHeaderState,
} from './types'

type EventHandler<EventName extends keyof AuthHeaderEvent> = UIEventHandler<
    AuthHeaderState,
    AuthHeaderEvent,
    EventName
>

export default class AuthHeaderLogic extends UILogic<
    AuthHeaderState,
    AuthHeaderEvent
> {
    constructor(private dependencies: AuthHeaderDependencies) {
        super()

        this.dependencies.services.auth.events.on('changed', () => {
            this._updateUser()
        })
    }

    getInitialState(): AuthHeaderState {
        return {
            loadState: 'pristine',
            user: this.dependencies.services.auth.getCurrentUser(),
            // user: { displayName: 'bla' },
            showMenu: false,
            // showMenu: true,
            showSettings: false,
            showAccountSettings: false,
            isMemexInstalled: false,
        }
    }

    _updateUser() {
        const user = this.dependencies.services.auth.getCurrentUser()
        this.emitMutation({
            user: { $set: user ? { displayName: user.displayName } : null },
        })
    }

    init: EventHandler<'init'> = async () => {
        await loadInitial<AuthHeaderState>(this, async () => {
            await this.dependencies.services.auth.waitForAuthReady()
        })
        const memexInstalled = isMemexInstalled()
        if (memexInstalled) {
            this.emitMutation({ isMemexInstalled: { $set: true } })
        }

        this._updateUser()
    }

    toggleMenu: EventHandler<'toggleMenu'> = () => {
        return { $toggle: ['showMenu'] }
    }

    hideMenu: EventHandler<'hideMenu'> = () => {
        return { showMenu: { $set: false } }
    }

    showSettings: EventHandler<'showSettings'> = () => {
        return { showSettings: { $set: true }, showMenu: { $set: false } }
    }

    hideSettings: EventHandler<'hideSettings'> = () => {
        return { showSettings: { $set: false } }
    }

    showAccountSettings: EventHandler<'showAccountSettings'> = () => {
        return { showAccountSettings: { $set: true } }
    }

    hideAccountSettings: EventHandler<'hideAccountSettings'> = () => {
        return { showAccountSettings: { $set: false } }
    }

    login: EventHandler<'login'> = async () => {
        this.dependencies.services.auth.requestAuth({
            reason: 'login-requested',
        })
    }

    logout: EventHandler<'logout'> = async () => {
        this.emitMutation({ showMenu: { $set: false } })
        await this.dependencies.services.auth.logout()
    }
}
