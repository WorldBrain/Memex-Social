import { User, UserReference } from "@worldbrain/memex-common/lib/web-interface/types/users";
import { AuthProvider } from "../../../types/auth";
import { Storage } from "../../../storage/types";
import { AuthMethod, AuthLoginFlow, AuthRequest, AuthResult } from "../types";
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

    async loginWithProvider(provider: AuthProvider, options?: { request?: AuthRequest }): Promise<{ result: AuthResult }> {
        const user: User = {
            displayName: 'John Doe',
        }
        this._user = user
        await this.options.storage.serverModules.users.ensureUser(user, this.getCurrentUserReference()!)

        this.events.emit('changed')

        return { result: { status: 'authenticated' } }
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
}
