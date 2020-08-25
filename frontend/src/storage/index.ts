import * as firebase from 'firebase'

import StorageManager, { StorageBackend } from "@worldbrain/storex";
import { DexieStorageBackend } from "@worldbrain/storex-backend-dexie";
import { FirestoreStorageBackend } from "@worldbrain/storex-backend-firestore";
import inMemory from "@worldbrain/storex-backend-dexie/lib/in-memory";
import { registerModuleMapCollections } from "@worldbrain/storex-pattern-modules";
import { BackendType } from "../types";

import { Storage } from "./types";
import UserStorage from "../features/user-management/storage";
import { StorageMiddleware } from "@worldbrain/storex/lib/types/middleware";
// import { checkAccountCollectionInfoMap } from './checks';
// import { ACCOUNT_COLLECTIONS } from './constants';
import ContentSharingStorage from '../features/content-sharing/storage';

export async function createStorage(options: { backend: BackendType | StorageBackend }): Promise<Storage> {
    let storageBackend: StorageBackend
    if (options.backend === 'memory') {
        storageBackend = new DexieStorageBackend({ dbName: 'useful-media', idbImplementation: inMemory() })
    } else if (options.backend === 'firebase' || options.backend === 'firebase-emulator') {
        storageBackend = new FirestoreStorageBackend({ firebase: firebase as any, firestore: firebase.firestore() as any })
        if (options.backend === 'firebase-emulator') {
            firebase.firestore().settings({
                host: "localhost:8080",
                ssl: false
            })
        }
    } else if (typeof options.backend === 'string') {
        throw new Error(`Tried to create storage with unknown backend: ${options.backend}`)
    } else {
        storageBackend = options.backend
    }
    const storageManager = new StorageManager({ backend: storageBackend })

    const storage: Storage = {
        serverStorageManager: storageManager,
        serverModules: {
            // auth: new AuthStorage({ storageManager }),
            users: new UserStorage({ storageManager }),
            contentSharing: new ContentSharingStorage({
                storageManager,
                autoPkType: options.backend !== 'memory' ? 'string' : 'number'
            })
        }
    }
    registerModuleMapCollections(storageManager.registry, storage.serverModules as any)
    await storageManager.finishInitialization()
    storageManager.setMiddleware(createStorageMiddleware())

    // if (process.env.NODE_ENV === 'development') {
    //     checkAccountCollectionInfoMap({
    //         storageRegistry: storageManager.registry,
    //         accountCollections: ACCOUNT_COLLECTIONS,
    //     })
    // }

    return storage
}

function createStorageMiddleware(): StorageMiddleware[] {
    const middleware: StorageMiddleware[] = []
    if (process.env.REACT_APP_LOG_STORAGE === 'true') {
        middleware.unshift(({
            process: ({ next, operation }) => {
                console.log(`executing storage operation:`, operation)
                return next.process({ operation })
            }
        }))
    }

    return middleware
}
