import * as firebase from 'firebase'

import StorageManager, { StorageBackend } from "@worldbrain/storex";
import { DexieStorageBackend } from "@worldbrain/storex-backend-dexie";
import { FirestoreStorageBackend } from "@worldbrain/storex-backend-firestore";
import inMemory from "@worldbrain/storex-backend-dexie/lib/in-memory";
import { registerModuleMapCollections, StorageModule } from "@worldbrain/storex-pattern-modules";
import { BackendType } from "../types";

import { Storage } from "./types";
import ProjectStorage from "./modules/projects";
import UserStorage from "./modules/users";
import AuthStorage from "./modules/auth";
import SubscriptionStorage from "./modules/subscriptions";
import { StorageMiddleware } from "@worldbrain/storex/lib/types/middleware";
import { checkAccountCollectionInfoMap } from './checks';
import { ACCOUNT_COLLECTIONS } from './constants';

export async function createStorage(options : { backend : BackendType }) : Promise<Storage> {
    let storageBackend : StorageBackend
    if (options.backend === 'memory') {
        storageBackend = new DexieStorageBackend({ dbName: 'useful-media', idbImplementation: inMemory() })
    } else if (options.backend === 'firebase') {
        storageBackend = new FirestoreStorageBackend({ firebase: firebase as any, firestore: firebase.firestore() })
    } else {
        throw new Error(`Tried to create storage with unknown backend: ${options.backend}`)
    }
    const storageManager = new StorageManager({ backend: storageBackend })

    const projects = new ProjectStorage({ storageManager })

    const storage : Storage = {
        manager: storageManager,
        modules: {
            auth: new AuthStorage({ storageManager }),
            users: new UserStorage({ storageManager }),
            projects,
            subscriptions: new SubscriptionStorage({ storageManager, projects }),
        }
    }
    registerModuleMapCollections(storageManager.registry, storage.modules as any)
    await storageManager.finishInitialization()
    storageManager.setMiddleware(createStorageMiddleware())

    if (process.env.NODE_ENV === 'development') {
        checkAccountCollectionInfoMap({
            storageRegistry: storageManager.registry,
            accountCollections: ACCOUNT_COLLECTIONS,
        })
    }

    return storage
}

function createStorageMiddleware() : StorageMiddleware[] {
    const middleware : StorageMiddleware[] = []
    if (process.env.REACT_APP_LOG_STORAGE === 'true') {
        middleware.unshift(({process: ({next, operation}) => {
            console.log(`executing storage operation:`, operation)
            return next.process({operation})
        }}))
    }
    
    return middleware
}
