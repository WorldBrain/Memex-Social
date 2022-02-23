import { User } from '@worldbrain/memex-common/lib/web-interface/types/users'
import firebase from 'firebase'
import { EventEmitter } from 'events'
import { Storage } from '../../storage/types'
import { AuthProvider } from '../../types/auth'
import {
    AuthMethod,
    AuthLoginFlow,
    AuthResult,
    RegistrationResult,
    EmailPasswordCredentials,
    LoginResult,
} from './types'
import { AuthServiceBase } from './base'
import { waitForAuth } from './utils'
import { LimitedWebStorage } from '../../utils/web-storage/types'

const FIREBASE_AUTH_CACHE_KEY = 'firebase.wasAuthenticated'

export default class FirebaseAuthService extends AuthServiceBase {
    events = new EventEmitter()
    private _firebase: typeof firebase
    private _user: User | null = null
    private _initialized = false
    _initialWaitForAuth?: Promise<void>

    constructor(
        firebaseRoot: typeof firebase,
        private options: {
            localStorage: LimitedWebStorage
            storage: Storage
        },
    ) {
        super()

        this._initialWaitForAuth = options.localStorage.getItem(
            FIREBASE_AUTH_CACHE_KEY,
        )
            ? (async () => {
                  const { waitingForAuth, stopWaiting } = waitForAuth(this)
                  await Promise.race([
                      waitingForAuth,
                      // There's reports of Firebase detecting auth state between 1.5 and 2 seconds after load  :(
                      // We've also observed this can even be slower on a slow internet connection
                      new Promise((resolve) => setTimeout(resolve, 10000)),
                  ])
                  stopWaiting()
                  delete this._initialWaitForAuth
              })()
            : undefined

        this._firebase = firebaseRoot
        this._user = null

        this._firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                options.localStorage.setItem(FIREBASE_AUTH_CACHE_KEY, 'true')
            } else {
                options.localStorage.removeItem(FIREBASE_AUTH_CACHE_KEY)
            }
            await this.refreshCurrentUser()
        })
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
        return options.method === 'external-provider' ? 'redirect' : null
    }

    async loginWithProvider(
        provider: AuthProvider,
    ): Promise<{ result: AuthResult }> {
        const firebaseProvider: any = ({
            facebook: new this._firebase.auth.FacebookAuthProvider(),
            google: new this._firebase.auth.GoogleAuthProvider(),
        } as any)[provider]

        try {
            await this._firebase.auth().signInWithPopup(firebaseProvider)
            return { result: { status: 'authenticated' } }
        } catch (e) {
            const firebaseError: firebase.FirebaseError = e
            if (firebaseError.code === 'auth/popup-closed-by-user') {
                return { result: { status: 'cancelled' } }
            }
            if (firebaseError.code === 'auth/popup-blocked') {
                return { result: { status: 'error', reason: 'popup-blocked' } }
            }
            return {
                result: {
                    status: 'error',
                    reason: 'unknown',
                    internalReason: firebaseError.code,
                },
            }
        }
    }

    async loginWithEmailPassword(
        options: EmailPasswordCredentials,
    ): Promise<{ result: LoginResult }> {
        try {
            const waitForChange = new Promise((resolve) =>
                this.events.once('changed', () => resolve()),
            )
            await this._firebase
                .auth()
                .signInWithEmailAndPassword(options.email, options.password)
            await waitForChange
            return { result: { status: 'authenticated' } }
        } catch (e) {
            const firebaseError: firebase.FirebaseError = e
            if (firebaseError.code === 'auth/invalid-email') {
                return { result: { status: 'error', reason: 'invalid-email' } }
            }
            if (firebaseError.code === 'auth/user-not-found') {
                return { result: { status: 'error', reason: 'user-not-found' } }
            }
            if (firebaseError.code === 'auth/wrong-password') {
                return { result: { status: 'error', reason: 'wrong-password' } }
            }
            return { result: { status: 'error', reason: 'unknown' } }
        }
    }

    async registerWithEmailPassword(
        options: EmailPasswordCredentials,
    ): Promise<{ result: RegistrationResult }> {
        try {
            await this._firebase
                .auth()
                .createUserWithEmailAndPassword(options.email, options.password)
            return { result: { status: 'registered-and-authenticated' } }
        } catch (e) {
            const firebaseError: firebase.FirebaseError = e
            if (firebaseError.code === 'auth/invalid-email') {
                return { result: { status: 'error', reason: 'invalid-email' } }
            }
            if (firebaseError.code === 'auth/email-already-in-use') {
                return { result: { status: 'error', reason: 'email-exists' } }
            }
            if (firebaseError.code === 'auth/weak-password') {
                return { result: { status: 'error', reason: 'weak-password' } }
            }
            return { result: { status: 'error', reason: 'unknown' } }
        }
    }

    async logout() {
        this._firebase.auth().signOut()
    }

    getCurrentUser() {
        return this._user
    }

    sendPasswordResetEmailProcess(email: string) {
        return firebase.auth().sendPasswordResetEmail(email)
    }

    changeEmailAddressonFirebase(email: string) {
        return firebase.auth().currentUser?.updateEmail(email)
    }

    getCurrentUserReference() {
        const id = this._firebase.auth().currentUser?.uid
        return id ? { type: 'user-reference' as 'user-reference', id } : null
    }

    async refreshCurrentUser(): Promise<void> {
        const alreadyInitialized = this._initialized
        this._initialized = true

        const user = this._firebase.auth().currentUser
        this._user =
            user &&
            (await _ensureFirebaseUser(
                user,
                this.options.storage.serverModules.users,
            ))
        if (!alreadyInitialized && !this._user?.displayName) {
            this._user = null
            this._firebase.auth().signOut()
            return
        }

        this.events.emit('changed')
    }

    async waitForAuthReady() {
        await this._initialWaitForAuth
    }
}

async function _ensureFirebaseUser(
    firebaseUser: firebase.User,
    userStorage: Storage['serverModules']['users'],
) {
    // const provider = firebaseUser.providerId as AuthProvider
    const user = await userStorage.ensureUser(
        {},
        { type: 'user-reference', id: firebaseUser.uid },
    )
    return user
}
