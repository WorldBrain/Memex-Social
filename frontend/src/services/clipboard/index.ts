import type {
    ClipboardServiceInterface,
    ClipboardServiceDependencies as Dependencies,
} from './types'

export default class ClipboardService implements ClipboardServiceInterface {
    constructor(private dependencies: Dependencies) {}

    async copy(text: string) {
        await this.dependencies.clipboard.writeText(text)
    }
}
