import type { ClipboardServiceInterface } from '@worldbrain/memex-common/lib/services/clipboard/types'
import type { ClipboardServiceDependencies as Dependencies } from './types'

export default class ClipboardService implements ClipboardServiceInterface {
    constructor(private dependencies: Dependencies) {}

    async copy(text: string) {
        await this.dependencies.clipboard.writeText(text)
    }
}
