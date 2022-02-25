import {
    User,
    UserReference,
} from '@worldbrain/memex-common/lib/web-interface/types/users'
import { AuthProvider } from '../../../types/auth'
import { Storage } from '../../../storage/types'
import {
    AuthMethod,
    AuthLoginFlow,
    AuthRequest,
    EmailPasswordCredentials,
    RegistrationResult,
    LoginResult,
} from '../types'
import { AuthServiceBase } from '../base'

interface AuthenticatedUser {
    user: User
    id: number | string
}

export default class MemoryAuthService extends AuthServiceBase {
    private _user: AuthenticatedUser | null = null

    constructor(private options: { storage: Storage }) {
        super()
        this._user = null
    }

    getSupportedMethods(options: {
        method: AuthMethod
        provider?: AuthProvider
    }): AuthMethod[] {
        return ['external-provider']
    }

    getLoginFlow(options: {
        method: AuthMethod
        provider?: AuthProvider
    }): AuthLoginFlow | null {
        return options.method === 'external-provider' ? 'direct' : null
    }

    async loginWithProvider(
        provider: AuthProvider,
        options?: { request?: AuthRequest },
    ): Promise<{ result: LoginResult }> {
        await this._login({ id: 'default-user', user: {} })
        return { result: { status: 'authenticated' } }
    }

    async loginWithEmailPassword(
        options: EmailPasswordCredentials,
    ): Promise<{ result: LoginResult }> {
        if (options.email === 'invalid-email') {
            return { result: { status: 'error', reason: 'invalid-email' } }
        }
        if (options.email === 'not@found.com') {
            return { result: { status: 'error', reason: 'user-not-found' } }
        }
        if (options.password === 'wrong-password') {
            return { result: { status: 'error', reason: 'wrong-password' } }
        }
        await this._login({ id: options.email, user: {} })
        return { result: { status: 'authenticated' } }
    }

    async registerWithEmailPassword(
        options: EmailPasswordCredentials,
    ): Promise<{ result: RegistrationResult }> {
        if (options.email === 'invalid-email') {
            return { result: { status: 'error', reason: 'invalid-email' } }
        }
        if (options.email === 'already@exists.com') {
            return { result: { status: 'error', reason: 'email-exists' } }
        }
        if (options.password === 'weak-password') {
            return { result: { status: 'error', reason: 'weak-password' } }
        }

        await this._login({ id: options.email, user: {} })
        return { result: { status: 'registered-and-authenticated' } }
    }

    async _login(user: AuthenticatedUser) {
        this._user = user

        await this.refreshCurrentUser()
    }

    async logout(): Promise<void> {
        this._user = null
        this.events.emit('changed', undefined)
    }

    getCurrentUser() {
        return this._user?.user ?? null
    }

    getCurrentUserReference(): UserReference | null {
        return this._user ? { type: 'user-reference', id: this._user.id } : null
    }

    sendPasswordResetEmailProcess(email: string) {
        return this._firebase.auth().sendPasswordResetEmail(email)
    }

    async refreshCurrentUser(): Promise<void> {
        if (this._user) {
            this._user.user = await this.options.storage.serverModules.users.ensureUser(
                this._user.user,
                this.getCurrentUserReference()!,
            )
        }
        this.events.emit('changed', this._user?.user)
    }

    async waitForAuthReady() {
        // return new Promise<void>(() => { })
    }
}
