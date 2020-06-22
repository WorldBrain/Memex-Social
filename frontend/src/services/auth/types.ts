import { EventEmitter } from "events";
import { AuthProvider } from "../../types/auth"
import { User } from "../../types/users"

export interface AuthService {
    events: EventEmitter

    loginWithProvider(provider: AuthProvider, options?: { request?: AuthRequest }): Promise<void>
    getCurrentUser(): User | null
    getCurrentUserID(): string | number | null
    getSupportedMethods(options: { method: AuthMethod, provider?: AuthProvider }): AuthMethod[]
    getLoginFlow(options: { method: AuthMethod, provider?: AuthProvider }): AuthLoginFlow | null

    requestAuth(options?: Omit<AuthRequest, 'onSuccess' | 'onFail'>): Promise<void>
    logout(): Promise<void>
}

export type AuthMethod = 'passwordless' | 'external-provider'
export type AuthLoginFlow =
    'direct' | // The provider will immediately create the account or fail, after which the user can continue
    'popup' | // There will be a pop-up the promise will reject or fail
    'redirect' | // There will be a redirect, but when the user comes back, there'll be a logged in user or an error
    'direct-with-confirm' // We'll get a direct response back whether the account was created, but the user needs to confirm their account
export interface AuthRequest {
    reason?: string
    onSuccess?: () => void
    onFail?: () => void
}