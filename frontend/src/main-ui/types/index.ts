import type * as history from 'history'
import type { GenerateServerID } from '@worldbrain/memex-common/lib/content-sharing/service/types'
import type { Services } from '../../services/types'
import type { Storage } from '../../storage/types'
import { ImageSupportInterface } from '@worldbrain/memex-common/lib/image-support/types'

export type { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'

export interface UIRunnerOptions {
    services: Services
    storage: Storage
    history: history.History
    generateServerId: GenerateServerID
    imageSupport: ImageSupportInterface
    getRootElement: () => HTMLElement
}

export type UIRunner = (options: UIRunnerOptions) => Promise<void>
