import type { GenerateServerID } from '@worldbrain/memex-common/lib/content-sharing/service/types'
import type { UIEvent } from '../../../../../main-ui/classes/logic'
import type { UIElementServices } from '../../../../../services/types'
import type { StorageModules } from '../../../../../storage/types'

export interface LoginOrSignupPageDependencies {
    services: UIElementServices<
        | 'auth'
        | 'router'
        | 'overlay'
        | 'contentSharing'
        | 'userManagement'
        | 'activityStreams'
        | 'pdfUploadService'
    >
    storage: Pick<StorageModules, 'users' | 'activityStreams'>
    getRootElement: () => HTMLElement
}

export type LoginOrSignupPageEvent = UIEvent<{}>
