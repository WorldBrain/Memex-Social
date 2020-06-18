import { Omit } from 'lodash';
import { StorageModule, StorageModuleConfig } from "@worldbrain/storex-pattern-modules";
import { STORAGE_VERSIONS } from "../versions";

export default class AuthStorage extends StorageModule {
    getConfig(): StorageModuleConfig {
        return {
            collections: {
            },
            operations: {
            },
            methods: {
            }
        }
    }
}
