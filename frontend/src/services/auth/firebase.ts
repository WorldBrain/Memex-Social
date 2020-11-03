import { User } from '@worldbrain/memex-common/lib/web-interface/types/users';
import * as firebase from 'firebase'
import { EventEmitter } from "events";
import { Storage } from '../../storage/types';
import { AuthProvider } from '../../types/auth';
import { AuthMethod, AuthLoginFlow, AuthResult, RegistrationResult, EmailPasswordCredentials, LoginResult } from "./types";
import { UnsavedMediaObject } from '@worldbrain/storex-media-middleware/lib/types';
import { AuthServiceBase } from './base';
const blobToBuffer = require('blob-to-buffer')

export default class FirebaseAuthService extends AuthServiceBase {
    events = new EventEmitter()
    private _firebase: typeof firebase
    private _user: User | null = null

    constructor(firebaseRoot: typeof firebase, private options: {
        storage: Storage,
    }) {
        super()

        this._firebase = firebaseRoot
        this._user = null

        this._firebase.auth().onAuthStateChanged(async () => {
            await this.refreshCurrentUser()
        })
    }

    getSupportedMethods(options: { method: AuthMethod, provider?: AuthProvider }): AuthMethod[] {
        return ['external-provider']
    }

    getLoginFlow(options: { method: AuthMethod, provider?: AuthProvider }): AuthLoginFlow | null {
        return options.method === 'external-provider' ? 'redirect' : null
    }

    async loginWithProvider(provider: AuthProvider): Promise<{ result: AuthResult }> {
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
            return { result: { status: 'error', reason: 'unknown', internalReason: firebaseError.code } }
        }
    }

    async loginWithEmailPassword(options: EmailPasswordCredentials): Promise<{ result: LoginResult }> {
        try {
            await this._firebase.auth().signInWithEmailAndPassword(options.email, options.password)
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

    async registerWithEmailPassword(options: EmailPasswordCredentials): Promise<{ result: RegistrationResult }> {
        try {
            await this._firebase.auth().signInWithEmailAndPassword(options.email, options.password)
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

    getCurrentUserReference() {
        const id = this._firebase.auth().currentUser?.uid
        return id ? { type: 'user-reference' as 'user-reference', id } : null
    }

    async refreshCurrentUser(): Promise<void> {
        const user = this._firebase.auth().currentUser
        this._user = user && await _ensureFirebaseUser(user, this.options.storage.serverModules.users)

        if (user) {
            _fetchUserPicture(user)
        }

        this.events.emit('changed')
    }
}

async function _ensureFirebaseUser(firebaseUser: firebase.User, userStorage: Storage['serverModules']['users']) {
    // const provider = firebaseUser.providerId as AuthProvider
    const user = await userStorage.ensureUser({
    }, { type: 'user-reference', id: firebaseUser.uid })
    return user
}

async function _fetchUserPicture(firebaseUser: firebase.User): Promise<UnsavedMediaObject | null> {
    if (!firebaseUser.photoURL) {
        return null
    }

    const photoResponse = await fetch(firebaseUser.photoURL)
    const photoBlob = await photoResponse.blob()
    const buffer = await new Promise((resolve: (buffer: Buffer) => void, reject) => {
        blobToBuffer(photoBlob, (err: Error, buffer: Buffer) => {
            if (err) {
                reject(err)
            } else {
                resolve(buffer)
            }
        })
    })

    return { data: buffer, mimetype: photoBlob.type }
}
