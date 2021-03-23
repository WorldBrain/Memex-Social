import { EventEmitter } from 'events'
import { AuthProvider } from '../../types/auth'
import {
    AuthService,
    AuthLoginFlow,
    AuthRequest,
    AuthMethod,
    AuthEvents,
    AuthResult,
    EmailPasswordCredentials,
    RegistrationResult,
    LoginResult,
} from './types'
import {
    User,
    UserReference,
} from '@worldbrain/memex-common/lib/web-interface/types/users'
import TypedEventEmitter from 'typed-emitter'

export abstract class AuthServiceBase implements AuthService {
    events: TypedEventEmitter<AuthEvents> = new EventEmitter()
    _initialWaitForAuth?: Promise<void>

    constructor() {
        this._initialWaitForAuth = (async () => {
            const { waitingForAuth, stopWaiting } = waitForAuth(this)
            await Promise.race([
                waitingForAuth,
                // There's reports of Firebase detecting auth state between 1.5 and 2 seconds after load  :(
                new Promise((resolve) => setTimeout(resolve, 3000)),
            ])
            stopWaiting()
            delete this._initialWaitForAuth
        })()
    }

    abstract loginWithProvider(
        provider: AuthProvider,
        options?: { request?: AuthRequest },
    ): Promise<{ result: AuthResult }>
    abstract loginWithEmailPassword(
        options: EmailPasswordCredentials,
    ): Promise<{ result: LoginResult }>
    abstract registerWithEmailPassword(
        options: EmailPasswordCredentials,
    ): Promise<{ result: RegistrationResult }>

    abstract getCurrentUser(): User | null
    abstract getCurrentUserReference(): UserReference | null
    abstract refreshCurrentUser(): Promise<void>

    abstract getSupportedMethods(options: {
        method: AuthMethod
        provider?: AuthProvider
    }): AuthMethod[]
    abstract getLoginFlow(options: {
        method: AuthMethod
        provider?: AuthProvider
    }): AuthLoginFlow | null

    abstract logout(): Promise<void>

    async enforceAuth(options?: AuthRequest): Promise<boolean> {
        await this._initialWaitForAuth
        if (this.getCurrentUser()) {
            return true
        }
        const {
            result: { status },
        } = await this.requestAuth(options)
        return (
            status === 'authenticated' ||
            status === 'registered-and-authenticated'
        )
    }

    async waitForAuthReady(): Promise<void> {
        await this._initialWaitForAuth
    }

    async waitForAuth() {
        const { waitingForAuth, stopWaiting } = waitForAuth(this)
        await waitingForAuth
        stopWaiting()
    }

    requestAuth(request?: AuthRequest): Promise<{ result: AuthResult }> {
        return new Promise<{ result: AuthResult }>((resolve) => {
            this.events.emit('authRequested', {
                ...request,
                emitResult: (result) => resolve({ result }),
            })
        })
    }
}

function waitForAuth(
    auth: AuthService,
): { waitingForAuth: Promise<void>; stopWaiting: () => void } {
    let destroyHandler = () => {}
    const stopWaiting = () => {
        destroyHandler()
        destroyHandler = () => {}
    }
    return {
        waitingForAuth: new Promise((resolve) => {
            const handler = () => {
                if (auth.getCurrentUser()) {
                    stopWaiting()
                    resolve()
                }
            }
            destroyHandler = () =>
                auth.events.removeListener('changed', handler)
            auth.events.addListener('changed', handler)
        }),
        stopWaiting,
    }
}
