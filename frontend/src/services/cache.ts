import { CreationInfoProps } from '@worldbrain/memex-common/lib/common-ui/components/creation-info'
import { EventEmitter } from '../utils/events'
import { UserReference } from '../features/user-management/types'
import { SharedAnnotation } from '@worldbrain/memex-common/lib/content-sharing/types'
export type CachedData = {
    currentUser: UserReference | null
    users: { [id: string]: CreationInfoProps['creatorInfo'] }
    annotations: { [url: string]: SharedAnnotation[] }
}

export type CacheListener = (keys: Set<keyof CachedData>) => void
export class CacheService {
    public _data: CachedData = {
        currentUser: null,
        users: {},
        annotations: {},
    }

    onUpdate = new EventEmitter<Set<keyof CachedData>>()

    getData() {
        // stupid, but just so _data signals that you should only modify it through setters
        return this._data
    }

    getKey<Key extends keyof CachedData>(key: Key) {
        return this._data[key]
    }

    setKey<Key extends keyof CachedData>(key: Key, value: CachedData[Key]) {
        this._data[key] = value
        const keys = new Set([key])
        this.onUpdate.emit(keys)
    }

    setKeys(updates: Partial<CachedData>) {
        Object.assign(this._data, updates)
        const keys = new Set(Object.keys(updates) as Array<keyof CachedData>)
        this.onUpdate.emit(keys)
    }
}
