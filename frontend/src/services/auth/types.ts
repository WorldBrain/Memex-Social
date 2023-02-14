import {
    User,
    UserReference,
} from '@worldbrain/memex-common/lib/web-interface/types/users'
import { AuthProvider } from '../../types/auth'
import TypedEventEmitter from 'typed-emitter'

export interface AuthService {
    events: TypedEventEmitter<AuthEvents>

    loginWithProvider(
        provider: AuthProvider,
        options?: { request?: AuthRequest },
    ): Promise<{ result: AuthResult }>
    loginWithEmailPassword(
        options: EmailPasswordCredentials,
    ): Promise<{ result: LoginResult }>
    sendPasswordResetEmailProcess(email: string): void
    changeEmailAddressonFirebase(email: string): Promise<void>
    registerWithEmailPassword(
        options: EmailPasswordCredentials,
    ): Promise<{ result: RegistrationResult }>

    getCurrentUser(): User | null
    getCurrentUserReference(): UserReference | null
    refreshCurrentUser(): Promise<void>
    getCurrentUserEmail(): string | null

    getSupportedMethods(options: {
        method: AuthMethod
        provider?: AuthProvider
    }): AuthMethod[]
    getLoginFlow(options: {
        method: AuthMethod
        provider?: AuthProvider
    }): AuthLoginFlow | null

    logout(): Promise<void>

    enforceAuth(options?: AuthRequest): Promise<boolean>
    waitForAuthReady(): Promise<void>
    waitForAuth(): Promise<void>
    waitForAuthSync(): Promise<void>
    requestAuth(options?: AuthRequest): Promise<{ result: AuthResult }>
}

export interface AuthEvents {
    changed(changedUser: Partial<User> | undefined): void
    authRequested(
        request: AuthRequest & { emitResult(result: AuthResult): void },
    ): void
}

export type AuthMethod = 'passwordless' | 'external-provider'
export type AuthLoginFlow =
    | 'direct' // The provider will immediately create the account or fail, after which the user can continue
    | 'popup' // There will be a pop-up the promise will reject or fail
    | 'redirect' // There will be a redirect, but when the user comes back, there'll be a logged in user or an error
    | 'direct-with-confirm' // We'll get a direct response back whether the account was created, but the user needs to confirm their account
export interface AuthRequest {
    reason?: AuthRequestReason
    header?: { title: string | JSX.Element; subtitle?: string | JSX.Element }
}
export type AuthRequestReason = 'login-requested' | 'registration-requested'

export type AuthResult = LoginResult | RegistrationResult
export type AuthError = LoginError | RegistrationError
export type LoginResult =
    | {
          status: 'authenticated' | 'cancelled'
      }
    | LoginError
export interface LoginError {
    status: 'error'
    reason:
        | 'popup-blocked'
        | 'invalid-email'
        | 'user-not-found'
        | 'wrong-password'
        | 'unknown'
    internalReason?: string
}

export type RegistrationResult =
    | {
          status: 'registered-and-authenticated' | 'cancelled'
      }
    | RegistrationError
export interface RegistrationError {
    status: 'error'
    reason: 'invalid-email' | 'email-exists' | 'weak-password' | 'unknown'
    internalReason?: string
}

export interface EmailPasswordCredentials {
    email: string
    password: string
}
