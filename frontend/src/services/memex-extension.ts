import {
    MemexOpenLinkParams,
    MemexOpenLinkDetail,
    MemexRequestHandledDetail,
    MEMEX_OPEN_LINK_EVENT_NAME,
    MEMEX_REQUEST_HANDLED_EVENT_NAME,
} from '@worldbrain/memex-common/lib/services/memex-extension'

export class MemexExtensionService {
    requestsMade = 0

    async openLink(params: MemexOpenLinkParams) {
        const requestId = ++this.requestsMade
        const detail: MemexOpenLinkDetail = {
            isCollaboratorLink: params.isCollaboratorLink,
            originalPageUrl: params.originalPageUrl,
            sharedListId: params.sharedListId,
            isOwnLink: params.isOwnLink,
            requestId,
        }
        const event = new CustomEvent(MEMEX_OPEN_LINK_EVENT_NAME, { detail })
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
        return new Promise<true>((resolve) => {
            const eventName = MEMEX_REQUEST_HANDLED_EVENT_NAME
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
