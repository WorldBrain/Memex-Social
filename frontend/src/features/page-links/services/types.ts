import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'

export interface PageLinkServiceInterface {
    createPageLink: (options: {
        fullPageUrl: string
        uploadedPdfParams?: {
            uploadId: string
            fingerprints: string[]
            title: string
        }
    }) => Promise<{
        remoteListId: AutoPk
        remoteListEntryId: AutoPk
    }>
}
