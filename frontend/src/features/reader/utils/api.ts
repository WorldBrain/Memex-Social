const DEFAULT_WEBSITE_TO_INJECT = 'https://www.martinfowler.com/'
const isStaging =
    process.env.REACT_APP_FIREBASE_PROJECT_ID?.includes('staging') ||
    process.env.NODE_ENV === 'development'
const ARCHIVE_PROXY_URL = isStaging
    ? 'https://cloudflare-memex-staging.memex.workers.dev'
    : 'https://cloudfare-memex.memex.workers.dev'

export const getWebsiteHTML = async (
    url: string = DEFAULT_WEBSITE_TO_INJECT,
) => {
    try {
        if (url) {
            const response = await fetch(
                `${ARCHIVE_PROXY_URL}/webarchive?url=${encodeURIComponent(
                    url,
                )}`,
            )
            const html = await response.text()

            return {
                url,
                html,
            }
        }
    } catch (e) {
        console.error(e)
    }

    return null
}
