import { AccountCollectionInfoMap } from './constants'
import { StorageRegistry } from '@worldbrain/storex'
import { collectAccountCollections } from './utils'

export function checkAccountCollectionInfoMap(options: {
    accountCollections: AccountCollectionInfoMap
    storageRegistry: StorageRegistry
}) {
    const accountCollections = collectAccountCollections(
        options.storageRegistry,
    )
    const collectionsWithAccountInfo = new Set(
        Object.keys(options.accountCollections),
    )
    const collectionsMissingAccountInfo = new Set(
        Object.keys(accountCollections).filter(
            (collection) => !collectionsWithAccountInfo.has(collection),
        ),
    )
    if (collectionsMissingAccountInfo.size > 0) {
        throw new Error(
            `We don't have account collection info on the following collections which should have it: ` +
                [...collectionsMissingAccountInfo].join(', '),
        )
    }
}
