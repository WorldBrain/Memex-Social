import type { ClipboardServiceDependencies } from './types'

export const mockClipboardAPI: ClipboardServiceDependencies['clipboard'] = {
    writeText: async (text) =>
        console.log('Clipboard Service - received text copy request:', text),
}
