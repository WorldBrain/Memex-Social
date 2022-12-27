import {
    MemexOpenLinkParams,
    MemexOpenLinkDetail,
    MemexRequestHandledDetail,
} from '@worldbrain/memex-common/lib/services/memex-extension'

export class MemexExtensionService {
    requestsMade = 0

    async openLink(params: MemexOpenLinkParams) {
        const requestId = ++this.requestsMade
        const detail: MemexOpenLinkDetail = {
            ...params,
            requestId,
        }
        const event = new CustomEvent('memex:open-link', { detail })
        const confirmation = this._waitForConfirmation(requestId)
        document.dispatchEvent(event)

        return Promise.race<Promise<boolean>>([
            confirmation,
            new Promise<boolean>((resolve) => {
                setTimeout(() => {
                    resolve(false)
                }, 1000)
            }),
        ])
    }

    async _waitForConfirmation(requestId: number) {
        return new Promise<boolean>((resolve) => {
            const eventName = 'memex:request-handled'
            const handler = (
                event: Event & { detail: MemexRequestHandledDetail },
            ) => {
                if (event.detail.requestId === requestId) {
                    document.removeEventListener(eventName, handler as any)
                    resolve(true)
                }
            }
            document.addEventListener(eventName, handler as any)
        })
    }
}
