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
    }) => {
        const { link } = await this.deps.contentSharingBackend.createPageLink({
            fullPageUrl,
        })
        const {
            remoteListId,
            remotePageInfoId,
        } = extractIdsFromSinglePageShareUrl(link)
        return { remoteListId, remotePageInfoId }
    }
}
