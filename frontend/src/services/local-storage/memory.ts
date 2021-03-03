import { LocalStorageService } from './types'

export class MemoryLocalStorageService implements LocalStorageService {
    _items: { [key: string]: string } = {}

    getItem(key: string) {
        return this._items[key] ?? null
    }

    setItem(key: string, value: string) {
        this._items[key] = value
    }
}
