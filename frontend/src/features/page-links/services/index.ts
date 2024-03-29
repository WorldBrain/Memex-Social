import { extractIdsFromSinglePageShareUrl } from '@worldbrain/memex-common/lib/content-sharing/utils'
import type { ContentSharingBackendInterface } from '@worldbrain/memex-common/lib/content-sharing/backend/types'
import type { PageLinkServiceInterface } from './types'

export default class PageLinkService implements PageLinkServiceInterface {
    constructor(
        private deps: {
            contentSharingBackend: Pick<
                ContentSharingBackendInterface,
                'createPageLink'
            >
        },
    ) {}

    createPageLink: PageLinkServiceInterface['createPageLink'] = async ({
        fullPageUrl,
        uploadedPdfParams,
    }) => {
        const { link } = await this.deps.contentSharingBackend.createPageLink({
            fullPageUrl,
            uploadedPdfParams,
        })
        const {
            remoteListId,
            remoteListEntryId,
        } = extractIdsFromSinglePageShareUrl(link)
        return { remoteListId, remoteListEntryId }
    }
}
