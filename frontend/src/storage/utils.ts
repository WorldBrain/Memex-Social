import { StorageRegistry, isChildOfRelationship, isConnectsRelationship } from "@worldbrain/storex";

const USER_ACCOUNT_COLLECTION = 'user'

export type CollectedAccountCollectionMap = {[collection : string] : CollectedAccountCollection}
export interface CollectedAccountCollection {
    alias : string
}

// TODO: This only collects collections that are directly related to the user, not indirectly as it should
export function collectAccountCollections(storageRegistry: StorageRegistry) : CollectedAccountCollectionMap {
    const accountCollections : CollectedAccountCollectionMap = {}
    for (const [collectionName, collectionDefinition] of Object.entries(storageRegistry.collections)) {
        for (const relationship of collectionDefinition.relationships || []) {
            if (isChildOfRelationship(relationship)) {
                if (relationship.targetCollection! === USER_ACCOUNT_COLLECTION) {
                    accountCollections[relationship.sourceCollection!] = {
                        alias: relationship.alias!
                    }
                }
            } else if (isConnectsRelationship(relationship)) {
                let index = -1
                for (const otherCollectionName of relationship.connects) {
                    index += 1

                    if (otherCollectionName === USER_ACCOUNT_COLLECTION) {
                        accountCollections[collectionName] = {
                            alias: relationship.aliases![index]
                        }
                    }
                }
            } else {
                throw new Error(`Account collection check failed because of unknown relationship type in collection '${collectionName}'`)
            }
        }
    }
    return accountCollections
}
