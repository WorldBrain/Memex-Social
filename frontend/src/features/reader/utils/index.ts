import { getWebsiteHTML } from './api'
import { injectHtml } from './utils'

export type MessagingApi = {
    getWebsiteHTML: (
        url?: string,
    ) => Promise<{
        archiveUrl: string
        url: string
        html: string
    } | null>
    injectHtml: (html: string, archiveUrl: string, url: string) => void
}

export default {
    getWebsiteHTML,
    injectHtml,
} as MessagingApi
