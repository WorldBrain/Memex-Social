const blobToBuffer = require('blob-to-buffer')
import * as firebase from 'firebase'
import { EventEmitter } from "events";
import { Storage } from '../../storage/types';
import { User } from '../../types/users';
import { AuthProvider } from '../../types/auth';
import { AuthMethod, AuthLoginFlow } from "./types";
import { Services } from '../types';
import { UnsavedMediaObject } from '@worldbrain/storex-media-middleware/lib/types';
import { AuthServiceBase } from './base';
import { UserEmail } from '../../types/storex-generated/users';

export default class FirebaseAuthService extends AuthServiceBase {
    events = new EventEmitter()
    private _firebase: typeof firebase
    private _user: User<true, null, 'emails'> | null = null

    constructor(firebaseRoot: typeof firebase, private options: {
        storage: Storage,
        services: Omit<Services, 'auth' | 'router'>
    }) {
        super()

        this._firebase = firebaseRoot
        this._user = null

        this._firebase.auth().onAuthStateChanged(async (user: firebase.User | null) => {
            this._user = user && await _ensureFirebaseUser(user, options.storage.modules.users)

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
}

async function _ensureFirebaseUser(firebaseUser: firebase.User, userStorage: Storage['modules']['users']) {
    const provider = firebaseUser.providerId as AuthProvider
    const user = await userStorage.ensureUser({
        id: firebaseUser.uid,
        isActive: true,
        emails: firebaseUser.email ? [
            { address: firebaseUser.email, isPrimary: true, isActive: true } as UserEmail<false>
        ] : []
    })
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
