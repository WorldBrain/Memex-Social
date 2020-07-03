import * as firebase from 'firebase'
import { EventEmitter } from "events";
import { Storage } from '../../storage/types';
import { User } from '../../types/users';
import { AuthProvider } from '../../types/auth';
import { AuthMethod, AuthLoginFlow } from "./types";
import { Services } from '../types';
import { UnsavedMediaObject } from '@worldbrain/storex-media-middleware/lib/types';
import { AuthServiceBase } from './base';
const blobToBuffer = require('blob-to-buffer')

export default class FirebaseAuthService extends AuthServiceBase {
    events = new EventEmitter()
    private _firebase: typeof firebase
    private _user: User | null = null

    constructor(firebaseRoot: typeof firebase, options: {
        storage: Storage,
    }) {
        super()

        this._firebase = firebaseRoot
        this._user = null

        this._firebase.auth().onAuthStateChanged(async (user: firebase.User | null) => {
            this._user = user && await _ensureFirebaseUser(user, options.storage.serverModules.users)

            if (user) {
                _fetchUserPicture(user)
            }

            this.events.emit('changed')
        })
    }

    getSupportedMethods(options: { method: AuthMethod, provider?: AuthProvider }): AuthMethod[] {
        return ['external-provider']
    }

    getLoginFlow(options: { method: AuthMethod, provider?: AuthProvider }): AuthLoginFlow | null {
        return options.method === 'external-provider' ? 'redirect' : null
    }

    async loginWithProvider(provider: AuthProvider) {
        const firebaseProvider: any = ({
            facebook: new this._firebase.auth.FacebookAuthProvider(),
            google: new this._firebase.auth.GoogleAuthProvider(),
        } as any)[provider]

        await this._firebase.auth().signInWithRedirect(firebaseProvider)
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
}

async function _ensureFirebaseUser(firebaseUser: firebase.User, userStorage: Storage['serverModules']['users']) {
    // const provider = firebaseUser.providerId as AuthProvider
    const user = await userStorage.ensureUser({
        isActive: true,
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
