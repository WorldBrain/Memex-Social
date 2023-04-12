import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'

export interface PageLinkServiceInterface {
    createPageLink: (options: {
        fullPageUrl: string
    }) => Promise<{
        remoteListId: AutoPk
        remotePageInfoId: AutoPk
    }>
}
