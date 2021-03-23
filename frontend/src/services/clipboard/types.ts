export interface ClipboardServiceDependencies {
    clipboard: Pick<Clipboard, 'writeText'>
}

export interface ClipboardServiceInterface {
    copy: (text: string) => Promise<void>
}
