import {
    UILogic,
    UIEventHandler,
    executeUITask,
} from '../../../../../main-ui/classes/logic'
import {
    AuthDialogEvent,
    AuthDialogDependencies,
    AuthDialogState,
    AuthDialogMode,
} from './types'
import {
    AuthResult,
    EmailPasswordCredentials,
} from '../../../../../services/auth/types'

type EventHandler<EventName extends keyof AuthDialogEvent> = UIEventHandler<
    AuthDialogState,
    AuthDialogEvent,
    EventName
>

export default class AuthDialogLogic extends UILogic<
    AuthDialogState,
    AuthDialogEvent
> {
    emitAuthResult?: (result: AuthResult) => void
    action?: 'login' | 'register'

    constructor(private dependencies: AuthDialogDependencies) {
        super()

        const { auth } = this.dependencies.services
        auth.events.on('authRequested', (event) => {
            this.emitAuthResult = event.emitResult
            this._setMode(
                event.reason === 'login-requested' ? 'login' : 'register',
            )
        })
    }

    getInitialState(): AuthDialogState {
        return {
            saveState: 'pristine',
            mode: 'hidden',
            email: '',
            password: '',
            displayName: '',
        }
    }

    init: EventHandler<'init'> = async () => {}

    close: EventHandler<'close'> = async () => {
        await this.dependencies.services.auth.logout()
        this._result({ status: 'cancelled' })
    }

    toggleMode: EventHandler<'toggleMode'> = async ({ previousState }) => {
        if (
            previousState.mode !== 'register' &&
            previousState.mode !== 'login'
        ) {
            return
        }

        this._setMode(previousState.mode === 'register' ? 'login' : 'register')
    }

    editEmail: EventHandler<'editEmail'> = ({ event }) => {
        return { email: { $set: event.value } }
    }

    editPassword: EventHandler<'editPassword'> = ({ event }) => {
        return { password: { $set: event.value } }
    }

    emailPasswordConfirm: EventHandler<'emailPasswordConfirm'> = async ({
        previousState,
    }) => {
        const credentials: EmailPasswordCredentials = {
            email: previousState.email,
            password: previousState.password,
        }
        await executeUITask<AuthDialogState>(this, 'saveState', async () => {
            const auth = this.dependencies.services.auth
            this.action = previousState.mode as 'login' | 'register'
            if (previousState.mode === 'register') {
                const { result } = await auth.registerWithEmailPassword(
                    credentials,
                )
                if (result.status === 'error') {
                    this.emitMutation({ error: { $set: result.reason } })
                } else {
                    this._setMode('profile')
                }
            } else if (previousState.mode === 'login') {
                const { result } = await auth.loginWithEmailPassword(
                    credentials,
                )
                if (result.status === 'error') {
                    this.emitMutation({ error: { $set: result.reason } })
                    return
                }
                if ((await auth.getCurrentUser())?.displayName) {
                    this._result({ status: 'authenticated' })
                } else {
                    this._setMode('profile')
                }
            }
        })
    }

    socialSignIn: EventHandler<'socialSignIn'> = async ({ event }) => {
        const {
            result,
        } = await this.dependencies.services.auth.loginWithProvider(
            event.provider,
        )
        this._result(result)
    }

    editDisplayName: EventHandler<'editDisplayName'> = ({ event }) => {
        return { displayName: { $set: event.value } }
    }

    confirmDisplayName: EventHandler<'confirmDisplayName'> = async ({
        previousState,
    }) => {
        await executeUITask<AuthDialogState>(this, 'saveState', async () => {
            const userReference = await this.dependencies.services.auth.getCurrentUserReference()
            if (!userReference) {
                throw new Error(
                    `Cannot set up profile without user being authenticated`,
                )
            }
            await this.dependencies.storage.users.updateUser(
                userReference,
                {},
                {
                    displayName: previousState.displayName,
                },
            )
            await this.dependencies.services.auth.refreshCurrentUser()
        })
        this._result({
            status:
                this.action === 'register'
                    ? 'registered-and-authenticated'
                    : 'authenticated',
        })
    }

    _setMode(mode: AuthDialogMode) {
        this.emitMutation({ mode: { $set: mode } })
    }

    _result(result: AuthResult) {
        this._setMode('hidden')
        this.emitAuthResult?.(result)
        delete this.emitAuthResult
    }
}
