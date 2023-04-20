const isStaging =
    process.env.REACT_APP_FIREBASE_PROJECT_ID?.includes('staging') ||
    process.env.NODE_ENV === 'development'
export const ARCHIVE_PROXY_URL = isStaging
    ? 'https://cloudflare-memex-staging.memex.workers.dev'
    : 'https://cloudfare-memex.memex.workers.dev'

export const getWebsiteHTML = async (
    url: string,
): Promise<{ url: string; html: string }> => {
    const response = await fetch(
        `${ARCHIVE_PROXY_URL}/webarchive?url=${encodeURIComponent(url)}`,
    )
    const html = await response.text()

    return { url, html }
}
