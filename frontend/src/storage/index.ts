import firebase from 'firebase'

import StorageManager, { StorageBackend } from "@worldbrain/storex";
import { DexieStorageBackend } from "@worldbrain/storex-backend-dexie";
import { FirestoreStorageBackend } from "@worldbrain/storex-backend-firestore";
import inMemory from "@worldbrain/storex-backend-dexie/lib/in-memory";
import { registerModuleMapCollections } from "@worldbrain/storex-pattern-modules";
import { StorageMiddleware } from "@worldbrain/storex/lib/types/middleware";
import { ChangeWatchMiddleware, ChangeWatchMiddlewareSettings } from '@worldbrain/storex-middleware-change-watcher'

import StorexActivityStreamsStorage from "@worldbrain/memex-common/lib/activity-streams/storage"
import UserStorage from "../features/user-management/storage";
import ContentSharingStorage from '../features/content-sharing/storage';
import ContentConversationStorage from '../features/content-conversations/storage';

import { BackendType } from "../types";
import { Storage } from "./types";

// import { checkAccountCollectionInfoMap } from './checks';
// import { ACCOUNT_COLLECTIONS } from './constants';

export async function createStorage(options: {
    backend: BackendType | StorageBackend,
    changeWatcher?: Pick<ChangeWatchMiddlewareSettings, 'shouldWatchCollection' | 'preprocessOperation' | 'postprocessOperation'>
}): Promise<Storage> {
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

    const contentSharing = new ContentSharingStorage({
        storageManager,
        autoPkType: options.backend !== 'memory' ? 'string' : 'number'
    })
    const storage: Storage = {
        serverStorageManager: storageManager,
        serverModules: {
            // auth: new AuthStorage({ storageManager }),
            users: new UserStorage({ storageManager }),
            contentSharing,
            contentConversations: new ContentConversationStorage({
                storageManager,
                autoPkType: options.backend !== 'memory' ? 'string' : 'number',
                contentSharing,
            }),
            activityStreams: new StorexActivityStreamsStorage({ storageManager })
        }
    }
    registerModuleMapCollections(storageManager.registry, storage.serverModules as any)
    await storageManager.finishInitialization()
    storageManager.setMiddleware(createStorageMiddleware({
        storageManager,
        changeWatcher: options.changeWatcher,
    }))

    // if (process.env.NODE_ENV === 'development') {
    //     checkAccountCollectionInfoMap({
    //         storageRegistry: storageManager.registry,
    //         accountCollections: ACCOUNT_COLLECTIONS,
    //     })
    // }

    return storage
}

function createStorageMiddleware(options: {
    storageManager: StorageManager,
    changeWatcher?: Pick<ChangeWatchMiddlewareSettings, 'shouldWatchCollection' | 'preprocessOperation' | 'postprocessOperation'>
}): StorageMiddleware[] {
    const middleware: StorageMiddleware[] = []
    if (process.env.REACT_APP_LOG_STORAGE === 'true') {
        middleware.unshift(({
            process: ({ next, operation }) => {
                console.log(`executing storage operation:`, operation)
                return next.process({ operation })
            }
        }))
    }
    if (options.changeWatcher) {
        middleware.push(new ChangeWatchMiddleware({
            ...options.changeWatcher,
            storageManager: options.storageManager,
        }))
    }

    return middleware
}
