import { StorageModule, StorageModuleConfig } from '@worldbrain/storex-pattern-modules'
import { STORAGE_VERSIONS } from '../../../storage/versions'
import { SharedCustomList } from '../../../types/storex-generated/content-sharing'

export default class ContentSharingStorage extends StorageModule {
    getConfig(): StorageModuleConfig {
        return {
            collections: {
                sharedCustomList: {
                    version: STORAGE_VERSIONS[0].date,
                    fields: {
                        ownerUserId: { type: 'string' },
                        createdWhen: { type: 'timestamp' },
                        updatedWhen: { type: 'timestamp' },
                        title: { type: 'string' },
                    },
                },
                sharedCustomListEntry: {
                    version: STORAGE_VERSIONS[0].date,
                    fields: {
                        listId: { type: 'string' },
                        createdWhen: { type: 'timestamp' },
                        updatedWhen: { type: 'timestamp' },
                        title: { type: 'string' },
                        url: { type: 'string' }
                    },
                }
            }
        }
    }

    // async createSharedList(list: SharedCustomList): Promise<{ id: string | number }> {

    // }
}
