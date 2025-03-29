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
import { waitForAuth } from './utils'

export abstract class AuthServiceBase implements AuthService {
    events: TypedEventEmitter<AuthEvents> = new EventEmitter()

    abstract loginWithProvider(
        provider: AuthProvider,
        options?: { request?: AuthRequest },
    ): Promise<{ result: AuthResult }>
    abstract loginWithEmailPassword(
        options: EmailPasswordCredentials,
    ): Promise<{ result: LoginResult }>
    abstract loginWithToken(token: string): Promise<{ result: LoginResult }>
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
    abstract waitForAuthReady(): Promise<void>

    abstract sendPasswordResetEmailProcess(email: string): void
    abstract changeEmailAddressonFirebase(email: string): Promise<void>
    abstract getCurrentUserData(): firebase.default.User | null
    abstract getCurrentUserEmail(): string | null

    async enforceAuth(
        options?: AuthRequest,
    ): Promise<{
        successful: boolean
        status:
            | 'authenticated'
            | 'registered-and-authenticated'
            | 'cancelled'
            | 'error'
        isNewUser?: boolean
        reactivatedUser?: boolean
    }> {
        await this.waitForAuthReady()

        if (this.getCurrentUser()) {
            return {
                successful: true,
                status: 'authenticated',
            }
        }
        const {
            result: { status },
            result,
        } = await this.requestAuth(options)

        const currentUser = this.getCurrentUserData()
        let creationTime = currentUser?.metadata.creationTime
        let signupTimeStamp = undefined

        if (creationTime) {
            signupTimeStamp = new Date(creationTime).getTime()
        }

        let isNewUser = false

        if (signupTimeStamp && signupTimeStamp < 600000) {
            isNewUser = true
        }

        const lastSignInTime = currentUser?.metadata.lastSignInTime
        let lastSignInDateTime = undefined
        if (lastSignInTime) {
            lastSignInDateTime = new Date(lastSignInTime).getTime()
        }

        let reactivatedUser = false
        //special case to also show the tutorial for people who had their last signin more than 3 months ago
        const THREE_MONTHS_IN_MS = 3 * 30 * 24 * 60 * 60 * 1000 // 3 months in milliseconds

        if (lastSignInDateTime && lastSignInDateTime > THREE_MONTHS_IN_MS) {
            reactivatedUser = true
        }

        return {
            successful:
                status === 'authenticated' ||
                status === 'registered-and-authenticated',
            status: status,
            isNewUser: isNewUser,
            reactivatedUser: reactivatedUser,
        }
    }

    async waitForAuth() {
        const { waitingForAuth, stopWaiting } = waitForAuth(this)
        const hasAuth = await waitingForAuth
        stopWaiting()
        return hasAuth
    }
    abstract waitForAuthSync(): Promise<void>

    requestAuth(request?: AuthRequest): Promise<{ result: AuthResult }> {
        return new Promise<{ result: AuthResult }>((resolve) => {
            this.events.emit('authRequested', {
                ...request,
                emitResult: (result) => resolve({ result }),
            })
        })
    }
}
