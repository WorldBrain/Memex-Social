export interface LocalStorageService {
    getItem(key: string): string | null
    setItem(key: string, value: string): void
}
