export interface Dependencies {
    clipboard: Pick<Clipboard, 'writeText'>
}

export default class ClipboardService {
    constructor(private dependencies: Dependencies) {}

    async copy(text: string) {
        await this.dependencies.clipboard.writeText(text)
    }
}

export const mockClipboardAPI: Dependencies['clipboard'] = {
    writeText: async (text) =>
        console.log('Clipboard Service - received text copy request:', text),
}
