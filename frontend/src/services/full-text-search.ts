import {
    SharedListEntrySearchRequest,
    SharedListEntrySearchResponse,
    SHARED_LIST_ENTRY_SEARCH_ROUTE,
} from '@worldbrain/memex-common/lib/content-sharing/search'
import { CLOUDFLARE_WORKER_URLS } from '@worldbrain/memex-common/lib/content-sharing/storage/constants'
import { determineEnv } from '../utils/runtime-environment'

export class FullTextSearchService {
    async searchListEntries(
        request: SharedListEntrySearchRequest,
    ): Promise<SharedListEntrySearchResponse> {
        const baseUrl =
            determineEnv() === 'production'
                ? CLOUDFLARE_WORKER_URLS.production
                : CLOUDFLARE_WORKER_URLS.staging
        const response = await fetch(
            `${baseUrl}${SHARED_LIST_ENTRY_SEARCH_ROUTE}`,
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
