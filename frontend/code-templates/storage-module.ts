import { StorageModule, StorageModuleConfig } from "@worldbrain/storex-pattern-modules";
import { STORAGE_VERSIONS } from "../versions";

export default class [Name]Storage extends StorageModule {
    getConfig() : StorageModuleConfig {
        return {
            collections: {
                [something]: {
                    version: STORAGE_VERSIONS[0].date,
                    fields: {
                    },
                },
            },
            operations: {
            },
            methods: {
            }
        }
    }
}
