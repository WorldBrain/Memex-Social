import { highlightDOMRange } from '@worldbrain/memex-common/lib/annotations/highlight-dom-range'

const sendMessageFromIframe = (message: string) => {
    console.log(message)
}

export const attachToWindow = () => {
    console.log(highlightDOMRange)
    // @ts-ignore
    window.injected = {
        sendMessageFromIframe,
        highlightDOMRange,
    }
}
