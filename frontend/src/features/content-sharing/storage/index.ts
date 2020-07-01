import { StorageModule, StorageModuleConfig } from '@worldbrain/storex-pattern-modules'
import { STORAGE_VERSIONS } from '../../../storage/versions'
import { SharedList, SharedListEntry, SharedListReference } from '../types'

interface StoredSharedListReference extends SharedListReference {
    id: string | number
}

export default class ContentSharingStorage extends StorageModule {
    getConfig = (): StorageModuleConfig => ({
        collections: {
            sharedList: {
                version: STORAGE_VERSIONS[0].date,
                fields: {
                    createdWhen: { type: 'timestamp' },
                    updatedWhen: { type: 'timestamp' },
                    title: { type: 'string' },
                },
                relationships: [
                    { alias: 'creator', childOf: 'user' }
                ]
            },
            sharedListEntry: {
                version: STORAGE_VERSIONS[0].date,
                fields: {
                    createdWhen: { type: 'timestamp' },
                    updatedWhen: { type: 'timestamp' },
                    title: { type: 'string' },
                    url: { type: 'string' }
                },
                relationships: [
                    { childOf: 'sharedList' }
                ],
                groupBy: [
                    { key: 'sharedList', subcollectionName: 'entries' }
                ]
            }
        },
        operations: {
            createSharedList: {
                operation: 'createObject',
                collection: 'sharedList',
            },
            createListEntries: {
                operation: 'executeBatch',
                args: ['$batch'],
            },
            findListByID: {
                operation: 'findObject',
                collection: 'sharedList',
                args: { id: '$id' }
            },
            findListEntriesByList: {
                operation: 'findObjects',
                collection: 'sharedListEntry',
                args: { sharedList: '$sharedListID' }
            }
        }
    })

    async createSharedList(listData: Omit<SharedList, 'createdWhen' | 'updatedWhen'>): Promise<SharedListReference> {
        const sharedList = (await this.operation('createSharedList', {
            ...listData,
            createdWhen: '$now',
            updatedWhen: '$now'
        })).object
        const reference: StoredSharedListReference = { type: 'shared-list-reference', id: sharedList.id }
        return reference
    }

    async createListEntries(listReference: SharedListReference, listEntries: SharedListEntry[]) {
        await this.operation('createListEntries', listEntries.map(entry => ({
            sharedList: (listReference as StoredSharedListReference).id,
            createdWhen: '$now',
            updatedWhen: '$now',
            ...entry,
        })))
    }

    getSharedListLinkID(listRefrence: SharedListReference): string {
        const id = (listRefrence as StoredSharedListReference).id
        return typeof id === "string" ? id : id.toString()
    }

    async retrieveList(listReference: SharedListReference): Promise<{ sharedList: SharedList, entries: SharedListEntry[] } | null> {
        const id = (listReference as StoredSharedListReference).id
        const sharedList: SharedList = await this.operation('findListByID', { id })
        if (!sharedList) {
            return null
        }

        const entries: SharedListEntry[] = await this.operation('findListEntriesByList', { sharedListID: id })
        return { sharedList, entries }
    }
}
