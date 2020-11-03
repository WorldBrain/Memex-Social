import { User, UserReference } from "@worldbrain/memex-common/lib/web-interface/types/users";
import { AuthProvider } from "../../../types/auth";
import { Storage } from "../../../storage/types";
import { AuthMethod, AuthLoginFlow, AuthRequest, EmailPasswordCredentials, RegistrationResult, LoginResult } from "../types";
import { AuthServiceBase } from "../base";

export default class MemoryAuthService extends AuthServiceBase {
    private _user: User | null = null

    constructor(private options: { storage: Storage }) {
        super()
        this._user = null
    }

    getSupportedMethods(options: { method: AuthMethod, provider?: AuthProvider }): AuthMethod[] {
        return ['external-provider']
    }

    getLoginFlow(options: { method: AuthMethod, provider?: AuthProvider }): AuthLoginFlow | null {
        return options.method === 'external-provider' ? 'direct' : null
    }

    async loginWithProvider(provider: AuthProvider, options?: { request?: AuthRequest }): Promise<{ result: LoginResult }> {
        const user: User = {
        }
        this._user = user

        await this.refreshCurrentUser()

        return { result: { status: 'authenticated' } }
    }

    async loginWithEmailPassword(options: EmailPasswordCredentials): Promise<{ result: LoginResult }> {
        if (options.email === 'invalid-email') {
            return { result: { status: 'error', reason: 'invalid-email' } }
        }
        if (options.email === 'not@found.com') {
            return { result: { status: 'error', reason: 'user-not-found' } }
        }
        if (options.password === 'wrong-password') {
            return { result: { status: 'error', reason: 'wrong-password' } }
        }
        return this.loginWithProvider('github')
    }

    async registerWithEmailPassword(options: EmailPasswordCredentials): Promise<{ result: RegistrationResult }> {
        if (options.email === 'invalid-email') {
            return { result: { status: 'error', reason: 'invalid-email' } }
        }
        if (options.email === 'already@exists.com') {
            return { result: { status: 'error', reason: 'email-exists' } }
        }
        if (options.password === 'weak-password') {
            return { result: { status: 'error', reason: 'weak-password' } }
        }

        await this.loginWithProvider('github')
        return { result: { status: 'registered-and-authenticated' } }
    }

    async logout(): Promise<void> {
        this._user = null
        this.events.emit('changed')
    }

    getCurrentUser() {
        return this._user
    }

    getCurrentUserReference(): UserReference | null {
        return this._user ? { type: 'user-reference', id: 'default-user' } : null
    }

    async refreshCurrentUser(): Promise<void> {
        if (this._user) {
            this._user = await this.options.storage.serverModules.users.ensureUser(this._user, this.getCurrentUserReference()!)
        }
        this.events.emit('changed')
    }
}
