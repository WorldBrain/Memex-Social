import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'

export interface PageLinkServiceInterface {
    createPageLink: (options: {
        fullPageUrl: string
        uploadedPdfId?: string
    }) => Promise<{
        remoteListId: AutoPk
        remoteListEntryId: AutoPk
    }>
}
