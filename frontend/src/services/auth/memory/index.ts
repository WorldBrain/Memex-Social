import { AuthProvider } from "../../../types/auth";
import { User } from "../../../types/users";
import { Storage } from "../../../storage/types";
import { AuthMethod, AuthLoginFlow, AuthRequest } from "../types";
import { AuthServiceBase } from "../base";
import USER_PICTURE_DATA_URLS from "./user-pictures.data";

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

    async loginWithProvider(provider: AuthProvider, options?: { request?: AuthRequest }) {
        const user: User = {
            isActive: true,
            displayName: 'Vincent den Boer',
            picture: USER_PICTURE_DATA_URLS[0],
            managementData: { provider },
        }
        this._user = user
        await this.options.storage.serverModules.users.ensureUser(user, this.getCurrentUserReference()!)

        this.events.emit('changed')

        if (options && options.request) {
            const request = options.request
            if (request.onSuccess) {
                request.onSuccess()
            }
        }
    }

    async logout(): Promise<void> {
        this._user = null
        this.events.emit('changed')
    }

    getCurrentUser() {
        return this._user
    }

    getCurrentUserReference() {
        return this._user ? { type: 'user-reference' as 'user-reference', id: 'test-user-1' } : null
    }
}
