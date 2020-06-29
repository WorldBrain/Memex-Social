import { Storage } from "../storage/types"
import { createStorage } from "../storage"

export interface StorageTestContext {
    storage: Storage
}
export type StorageTest = (context: StorageTestContext) => Promise<void>
export type StorageTestFactory = (description: string, test: StorageTest) => void

export function createStorageTestFactory() {
    const factory: StorageTestFactory = (description, test) => {
        it(description, async () => {
            const storage = await createStorage({ backend: 'memory' })
            await test({ storage })
        })
    }

    return factory
}
