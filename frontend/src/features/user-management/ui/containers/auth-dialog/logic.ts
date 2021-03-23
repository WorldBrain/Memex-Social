import {
    UILogic,
    UIEventHandler,
    executeUITask,
} from '../../../../../main-ui/classes/logic'
import {
    AuthDialogEvent,
    AuthDialogDependencies,
    AuthDialogState,
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
            this.emitMutation({
                mode: {
                    $set:
                        event.reason === 'login-requested'
                            ? 'login'
                            : 'register',
                },
                header: { $set: event.header ?? undefined },
            })
        })
    }

    getInitialState(): AuthDialogState {
        return {
            saveState: 'pristine',
            mode: 'hidden',
            email: '',
            password: '',
            displayName: '',
            header: null,
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

        this.emitMutation({
            mode: {
                $set: previousState.mode === 'register' ? 'login' : 'register',
            },
        })
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
                    this.emitMutation({ mode: { $set: 'profile' } })
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
                    this.emitMutation({ mode: { $set: 'profile' } })
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

    _result(result: AuthResult) {
        this.emitMutation({ mode: { $set: 'hidden' } })
        this.emitAuthResult?.(result)
        delete this.emitAuthResult
    }
}
