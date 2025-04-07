import { EventEmitter } from '../utils/events'

export type ThemeVariant = 'light' | 'dark'

export interface ThemeServiceDeps {
    getPersistedThemeVariant: () => Promise<ThemeVariant | null>
    setPersistedThemeVariant: (variant: ThemeVariant) => Promise<void>
    removePersistedThemeVariant: () => Promise<void>
}

/**
 * Service allowing user to manually override theme variant.
 * Use the `useTheme` hook to use this with a fallback to system settings.
 */
export class ThemeService {
    // TODO: Why it doesn't need interface
    initialized: Promise<void>
    variant: ThemeVariant | null = null

    onVariantUpdate = new EventEmitter<ThemeVariant | null>()

    constructor(private deps: ThemeServiceDeps) {
        this.initialized = (async () => {
            const variant = await this.deps.getPersistedThemeVariant()
            if (variant) {
                this.setThemeVariant(variant, false)
            }
        })()
    }

    async getThemeVariant() {
        await this.initialized
        return this.variant
    }

    async setThemeVariant(variant: ThemeVariant | null, store = true) {
        // Optimistically update UI,
        this.variant = variant
        this.onVariantUpdate.emit(variant)

        // but await this, so if there's an error, we can show the user it's not saved
        if (store) {
            if (variant) {
                await this.deps.setPersistedThemeVariant(variant)
            } else {
                await this.deps.removePersistedThemeVariant()
            }
        }
    }
}
