import type { GenerateServerID } from '@worldbrain/memex-common/lib/content-sharing/service/types'
import type { UIEvent } from '../../../../../main-ui/classes/logic'
import type { UIElementServices } from '../../../../../services/types'
import type { StorageModules } from '../../../../../storage/types'

export interface PageLinkCreationPageDependencies {
    services: UIElementServices<
        | 'auth'
        | 'router'
        | 'overlay'
        | 'pageLinks'
        | 'userManagement'
        | 'webMonetization'
        | 'activityStreams'
        | 'pdfUploadService'
    >
    storage: Pick<StorageModules, 'users' | 'activityStreams'>
    fullPageUrl: string | null
    generateServerId: GenerateServerID
    getRootElement: () => HTMLElement
}

export type PageLinkCreationPageEvent = UIEvent<{}>
