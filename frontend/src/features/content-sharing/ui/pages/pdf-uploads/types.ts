import type { UIEvent } from '../../../../../main-ui/classes/logic'
import type { UIElementServices } from '../../../../../services/types'
import type { StorageModules } from '../../../../../storage/types'

export interface PdfUploadPageDependencies {
    services: UIElementServices<
        | 'auth'
        | 'router'
        | 'overlay'
        | 'pageLinks'
        | 'userManagement'
        | 'webMonetization'
        | 'activityStreams'
    >
    storage: Pick<StorageModules, 'users' | 'activityStreams'>
}

export type PdfUploadPageEvent = UIEvent<{}>
