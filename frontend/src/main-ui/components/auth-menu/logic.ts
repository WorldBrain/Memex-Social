import { User } from "../../../types/users"
import { UILogic, UIEvent, UIMutation } from "../../classes/logic"
import { Services } from "../../../services/types";
import { AuthRequest } from "../../../services/auth/types";

export interface Options {
    services : Pick<Services, 'auth' | 'router'>
}
export interface State {
    user : User | null
    showMenu : boolean
    showAuthOverlay : boolean
    authRequest? : AuthRequest
    lastClosedWhen?: number
}
export type Event = UIEvent<{
    userChanged: { user : User | null }
    toggleVisibility: {}
    toggleAuthOverlay: {}
    setAuthOverlayVisible: { shown : boolean, authRequest : AuthRequest }
    goToAccount: {},
    signOut: {},
}>

export default class Logic extends UILogic<State, Event> {
    constructor(private options : Options) {
        super()

        this.subscribeToServiceEvent(options.services.auth, 'changed', () => {
            const user = options.services.auth.getCurrentUser()
            this.emitMutation(this.processUserChanged({ user }))
        })
        this.subscribeToServiceEvent(options.services.auth, 'authRequested', (authRequest : AuthRequest) => {
            this.emitMutation(this.processSetAuthOverlayVisible({ authRequest, shown: true }))
        })
    }

    getInitialState() : State {
        return {
            user: this.options.services.auth.getCurrentUser(),
            showMenu: false,
            showAuthOverlay: false,
        }
    }

    processSetAuthOverlayVisible(event : Event['setAuthOverlayVisible']) {
        return { showAuthOverlay: { $set: event.shown }, authRequest: { $set: event.authRequest } }
    }

    processToggleAuthOverlay(event : Event['toggleAuthOverlay'], options : { state : State }) : UIMutation<State> {
        return { showAuthOverlay: { $set: !options.state.showAuthOverlay } }
    }

    processUserChanged(event : Event['userChanged']) : UIMutation<State> {
        const showAuthOverlay = event.user ? { showAuthOverlay: { $set: false } } : {}
        return { user: { $set: event.user }, ...showAuthOverlay }
    }

    processToggleVisibility(event : Event['toggleVisibility'], options : { state : State }) : UIMutation<State> {
        const willBeVisible = !options.state.showMenu
        if (willBeVisible && options.state.lastClosedWhen) {
            const howLongAgo = Date.now() - options.state.lastClosedWhen
            if (howLongAgo < 100) {
                return {}
            }
        }

        const lastClosedWhen = !willBeVisible ? Date.now() : options.state.lastClosedWhen
        return {
            showMenu: { $set: willBeVisible },
            lastClosedWhen: { $set: lastClosedWhen }
        }
    }

    processGoToAccount(event : Event['goToAccount'], options : { state : State }) : UIMutation<State> {
        this.options.services.router.goTo('userHome')
        return { showMenu: { $set: false } }
    }

    processSignOut(event : Event['signOut'], options : { state : State }) : UIMutation<State> {
        this.options.services.auth.logout()
        return { showMenu: { $set: false } }
    }
}
