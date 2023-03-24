import {
    SharedListEntrySearchRequest,
    SharedListEntrySearchResponse,
    SHARED_LIST_ENTRY_SEARCH_ROUTE,
} from '@worldbrain/memex-common/lib/content-sharing/search'

export class FullTextSearchService {
    async searchListEntries(
        request: SharedListEntrySearchRequest,
    ): Promise<SharedListEntrySearchResponse> {
        const base =
            process.env.REACT_APP_FIREBASE_PROJECT_ID === 'worldbrain-staging'
                ? 'https://cloudflare-memex-staging.memex.workers.dev'
                : 'https://cloudfare-memex.memex.workers.dev'
        const response = await fetch(
            `${base}${SHARED_LIST_ENTRY_SEARCH_ROUTE}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            },
        )
        return (await response.json()) as SharedListEntrySearchResponse
    }
}
