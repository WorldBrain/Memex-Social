import { highlightDOMRange } from '@worldbrain/memex-common/lib/annotations/highlight-dom-range'

export interface IframMessageHandlers {
    sendMessageFromIframe(message: string): void
}

export const setupIframeComms = (handlers: IframMessageHandlers) => {
    ;(window as any).injected = {
        ...handlers,
        highlightDOMRange,
    }

    return {
        cleanup: () => {
            delete (window as any).injected
        },
    }
}
