const isStaging =
    process.env.REACT_APP_FIREBASE_PROJECT_ID?.includes('staging') ||
    process.env.NODE_ENV === 'development'
export const ARCHIVE_PROXY_URL = isStaging
    ? 'https://cloudflare-memex-staging.memex.workers.dev'
    : 'https://cloudfare-memex.memex.workers.dev'

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
