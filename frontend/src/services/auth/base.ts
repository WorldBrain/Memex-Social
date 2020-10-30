import { EventEmitter } from "events";
import { AuthProvider } from "../../types/auth"
import { AuthService, AuthLoginFlow, AuthRequest, AuthMethod, AuthEvents, AuthResult } from "./types";
import { User, UserReference } from "@worldbrain/memex-common/lib/web-interface/types/users";
import TypedEventEmitter from "typed-emitter";


export abstract class AuthServiceBase implements AuthService {
    events: TypedEventEmitter<AuthEvents> = new EventEmitter()

    abstract loginWithProvider(provider: AuthProvider, options?: { request?: AuthRequest }): Promise<{ result: AuthResult }>
    abstract getCurrentUser(): User | null
    abstract getCurrentUserReference(): UserReference | null
    abstract getSupportedMethods(options: { method: AuthMethod, provider?: AuthProvider }): AuthMethod[]
    abstract getLoginFlow(options: { method: AuthMethod, provider?: AuthProvider }): AuthLoginFlow | null
    abstract logout(): Promise<void>

    requestAuth(request?: AuthRequest): Promise<{ result: AuthResult }> {
        return new Promise<{ result: AuthResult }>((resolve) => {
            this.events.emit('authRequested', {
                ...request,
                emitResult: result => resolve({ result })
            })
        })
    }
}
