import { LocalStorageService } from './types'
import { LimitedWebStorage } from '../../utils/web-storage/types'

export class BrowserLocalStorageService implements LocalStorageService {
    constructor(private localStorage: LimitedWebStorage) {}

    getItem(key: string) {
        return this.localStorage.getItem(key)
    }

    setItem(key: string, value: string) {
        this.localStorage.setItem(key, value)
    }
}
