import { ChangeWatchMiddlewareSettings } from '@worldbrain/storex-middleware-change-watcher'
import { STORAGE_HOOKS } from '@worldbrain/memex-common/lib/storage/hooks'
import {
    StorageHook,
    StorageHookContext,
} from '@worldbrain/memex-common/lib/storage/hooks/types'
import { Storage } from './types'
import { Services } from '../services/types'

type HooksByCollectionAndOperation = {
    [collection: string]: {
        [operation: string]: { hook: StorageHook; pkIndex: string }
    }
}

export class StorageHooksChangeWatcher {
    initialized = false
    collectionsToWatch?: Set<string>
    hooksByCollectionAndOperation: HooksByCollectionAndOperation = {}
    dependencies?: { storage: Storage; services: Services }

    setUp(dependencies: { storage: Storage; services: Services }) {
        if (this.initialized) {
            throw new Error(`Can't set up storage hooks more than once`)
        }

        this.collectionsToWatch = new Set<string>()
        for (const hook of Object.values(STORAGE_HOOKS)) {
            const { collection } = hook

            this.collectionsToWatch.add(collection)
            const pkIndex =
                dependencies.storage.serverStorageManager.registry.collections[
                    collection
                ].pkIndex
            if (typeof pkIndex !== 'string') {
                throw new Error(
                    `Can't use storage hooks on collections that don't have a simple primary key ('${collection}').`,
                )
            }

            const collectionHooks: HooksByCollectionAndOperation[keyof HooksByCollectionAndOperation] =
                this.hooksByCollectionAndOperation[collection] ?? {}
            collectionHooks[hook.operation] = { hook, pkIndex }
            this.hooksByCollectionAndOperation[collection] = collectionHooks
        }

        this.dependencies = dependencies
        this.initialized = true
    }

    shouldWatchCollection: ChangeWatchMiddlewareSettings['shouldWatchCollection'] = (
        collection,
    ) => {
        return this.collectionsToWatch?.has?.(collection) ?? false
    }

    preprocessOperation: ChangeWatchMiddlewareSettings['preprocessOperation'] = async ({
        info,
    }) => {
        for (const change of info.changes) {
            const collectionHooks = this.hooksByCollectionAndOperation[
                change.collection
            ]
            if (!collectionHooks) {
                continue
            }
            const hookInfo = collectionHooks[change.type]
            if (!hookInfo) {
                continue
            }
            const { hook, pkIndex } = hookInfo

            if (change.type === 'delete') {
                for (const pk of change.pks) {
                    const pkAsScalar = pk as string | number
                    const context: StorageHookContext = {
                        collection: change.collection,
                        objectId: pkAsScalar,
                        operation: change.type,
                        userReference: this.dependencies!.services.auth.getCurrentUserReference(),
                        getObject: async () =>
                            this.dependencies!.storage.serverStorageManager.operation(
                                'findObject',
                                change.collection,
                                { [pkIndex]: pkAsScalar },
                            ),
                        services: this.dependencies!.services,
                    }
                    await hook.function(context)
                }
            }
        }
    }

    postprocessOperation: ChangeWatchMiddlewareSettings['postprocessOperation'] = async ({
        info,
    }) => {
        for (const change of info.changes) {
            const collectionHooks = this.hooksByCollectionAndOperation[
                change.collection
            ]
            if (!collectionHooks) {
                continue
            }
            const hookInfo = collectionHooks[change.type]
            if (!hookInfo) {
                continue
            }
            const { hook, pkIndex } = hookInfo

            if (change.type === 'create') {
                const pkAsScalar = change.pk as string | number
                const context: StorageHookContext = {
                    collection: change.collection,
                    objectId: pkAsScalar,
                    operation: change.type,
                    userReference: this.dependencies!.services.auth.getCurrentUserReference(),
                    getObject: async () =>
                        this.dependencies!.storage.serverStorageManager.operation(
                            'findObject',
                            change.collection,
                            { [pkIndex]: pkAsScalar },
                        ),
                    services: this.dependencies!.services,
                }
                await hook.function(context)
            }
        }
    }
}
