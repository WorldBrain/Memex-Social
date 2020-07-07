import { EventEmitter } from "events";
import { AuthProvider } from "../../types/auth"
import { AuthService, AuthLoginFlow, AuthRequest, AuthMethod } from "./types";
import { User, UserReference } from "@worldbrain/memex-common/lib/web-interface/types/users";


export abstract class AuthServiceBase implements AuthService {
    events: EventEmitter = new EventEmitter()

    abstract loginWithProvider(provider: AuthProvider, options?: { request?: AuthRequest }): Promise<void>
    abstract getCurrentUser(): User | null
    abstract getCurrentUserReference(): UserReference | null
    abstract getSupportedMethods(options: { method: AuthMethod, provider?: AuthProvider }): AuthMethod[]
    abstract getLoginFlow(options: { method: AuthMethod, provider?: AuthProvider }): AuthLoginFlow | null
    abstract logout(): Promise<void>

    requestAuth(options?: Omit<AuthRequest, 'onSuccess' | 'onFail'>) {
        return new Promise<void>((resolve, reject) => {
            const request: AuthRequest = {
                ...options,
                onSuccess: resolve,
                onFail: reject,
            }
            this.events.emit('authRequested', request)
        })
    }
}
