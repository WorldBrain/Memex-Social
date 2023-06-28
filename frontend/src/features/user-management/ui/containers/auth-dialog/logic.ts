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
import { isMemexInstalled } from '../../../../../utils/memex-installed'

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

    isIframe = () => {
        try {
            return window.self !== window.top
        } catch (e) {
            return true
        }
    }

    constructor(private dependencies: AuthDialogDependencies) {
        super()

        const { auth } = this.dependencies.services
        auth.events.on('authRequested', (event) => {
            this.emitAuthResult = event.emitResult

            setTimeout(() => {
                let memexInstalled = isMemexInstalled()
                if (memexInstalled) {
                    if (this.isIframe()) {
                        this.emitMutation({
                            mode: {
                                $set: 'hidden',
                            },
                            saveState: { $set: 'running' },
                            header: { $set: event.header ?? undefined },
                        })
                        auth.events.on('changed', () => {
                            if (auth.getCurrentUserReference()) {
                                this._result({ status: 'authenticated' })
                            }
                        })
                        setTimeout(() => {
                            if (auth.getCurrentUserReference() == null) {
                                this.emitMutation({
                                    mode: {
                                        $set:
                                            event.reason === 'login-requested'
                                                ? 'login'
                                                : 'register',
                                    },
                                    header: { $set: event.header ?? undefined },
                                })
                            }
                        }, 5000)
                    } else {
                        this.emitMutation({
                            mode: {
                                $set:
                                    event.reason === 'login-requested'
                                        ? 'login'
                                        : 'register',
                            },
                            header: { $set: event.header ?? undefined },
                        })
                    }
                } else {
                    if (this.isIframe()) {
                        this.emitMutation({
                            mode: {
                                $set: 'hidden',
                            },
                            saveState: { $set: 'running' },
                            header: { $set: event.header ?? undefined },
                        })
                        auth.events.on('changed', () => {
                            if (auth.getCurrentUserReference()) {
                                this._result({ status: 'authenticated' })
                            }
                        })
                        setTimeout(() => {
                            if (auth.getCurrentUserReference() == null) {
                                this.emitMutation({
                                    mode: {
                                        $set:
                                            event.reason === 'login-requested'
                                                ? 'login'
                                                : 'register',
                                    },
                                    header: { $set: event.header ?? undefined },
                                })
                            }
                        }, 5000)
                    } else {
                        this.emitMutation({
                            mode: {
                                $set:
                                    event.reason === 'login-requested'
                                        ? 'login'
                                        : 'register',
                            },
                            header: { $set: event.header ?? undefined },
                        })
                    }
                }
            }, 100)
        })

        auth.events.on('changed', () => {
            if (auth.getCurrentUserReference()) {
                this._result({ status: 'authenticated' })
            }
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
            passwordRepeat: '',
            passwordMatch: false,
        }
    }

    init: EventHandler<'init'> = async () => {}

    close: EventHandler<'close'> = async () => {
        await this.dependencies.services.auth.logout()
        this._result({ status: 'cancelled' })
    }

    toggleMode: EventHandler<'toggleMode'> = async ({ previousState }) => {
        if (previousState.mode === 'ConfirmResetPassword') {
            this.emitMutation({
                mode: {
                    $set: 'login',
                },
            })
        }

        if (previousState.mode === 'resetPassword') {
            this.emitMutation({
                mode: {
                    $set: 'ConfirmResetPassword',
                },
            })
        }

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

    passwordRepeat: EventHandler<'editPassword'> = ({ event }) => {
        return { passwordRepeat: { $set: event.value } }
    }

    passwordMatch: EventHandler<'passwordMatch'> = ({ event }) => {
        return { passwordMatch: { $set: event.value } }
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
            const isReader =
                window.location.href.includes('/c/') &&
                !window.location.href.includes('/p/')
            this.action = previousState.mode as 'login' | 'register'
            const displayName = previousState.displayName.trim()
            if (previousState.mode === 'register') {
                if (!displayName.length) {
                    this.emitMutation({
                        error: { $set: 'display-name-missing' },
                    })
                    return
                }
                const { result } = await auth.registerWithEmailPassword(
                    credentials,
                )
                if (result.status === 'error') {
                    this.emitMutation({ error: { $set: result.reason } })
                } else {
                    const userReference = this.dependencies.services.auth.getCurrentUserReference()
                    if (!userReference) {
                        throw new Error(
                            `Cannot set up profile without user being authenticated`,
                        )
                    }
                    await this.dependencies.storage.users.updateUser(
                        userReference,
                        {},
                        { displayName },
                    )
                    if (isReader) {
                        await this.dependencies.services.listKeys.processCurrentKey()
                    }
                    await this.dependencies.services.auth.refreshCurrentUser()
                    this._result({
                        status:
                            this.action === 'register'
                                ? 'registered-and-authenticated'
                                : 'authenticated',
                    })
                }
            } else if (previousState.mode === 'login') {
                const { result } = await auth.loginWithEmailPassword(
                    credentials,
                )
                if (result.status === 'error') {
                    this.emitMutation({ error: { $set: result.reason } })
                    return
                }
                const currentUser = auth.getCurrentUser()
                if (isReader) {
                    await this.dependencies.services.listKeys.processCurrentKey()
                }
                if (currentUser?.displayName) {
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
        return { displayName: { $set: event } }
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

    passwordResetSwitch: EventHandler<'passwordResetSwitch'> = () => {
        this.emitMutation({
            mode: {
                $set: 'resetPassword',
            },
        })
    }

    passwordResetConfirm: EventHandler<'passwordResetConfirm'> = () => {
        this.emitMutation({
            mode: {
                $set: 'ConfirmResetPassword',
            },
        })
    }

    passwordReset: EventHandler<'passwordReset'> = async ({
        event,
        previousState,
    }) => {
        const auth = this.dependencies.services.auth
        auth.sendPasswordResetEmailProcess(previousState.email)
    }
}
