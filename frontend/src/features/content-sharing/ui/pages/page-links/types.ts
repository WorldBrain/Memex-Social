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
    >
    storage: Pick<StorageModules, 'users' | 'activityStreams'>
    fullPageUrl: string
}

export type PageLinkCreationPageEvent = UIEvent<{}>
