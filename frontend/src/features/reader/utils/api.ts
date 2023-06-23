import { CLOUDFLARE_WORKER_URLS } from '@worldbrain/memex-common/lib/content-sharing/storage/constants'
import { determineEnv } from '../../../utils/runtime-environment'

export const ARCHIVE_PROXY_URL =
    determineEnv() === 'production'
        ? CLOUDFLARE_WORKER_URLS.production
        : CLOUDFLARE_WORKER_URLS.staging

async function fetchAndHandleErrors(url: string): Promise<Response> {
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(
            `Page fetch failed with HTTP code ${response.status}: ${response.statusText}`,
        )
    }
    return response
}

export const fetchWebsiteHTML = async (
    originalUrl: string,
): Promise<string> => {
    const response = await fetchAndHandleErrors(
        `${ARCHIVE_PROXY_URL}/webarchive?url=${encodeURIComponent(
            originalUrl,
        )}`,
    )
    const html = await response.text()
    return html
}
