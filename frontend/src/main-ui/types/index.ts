import type * as history from 'history'
import { Services } from '../../services/types'
import { Storage } from '../../storage/types'

export type { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'

export type UiRunner = (options: {
    services: Services
    storage: Storage
    history: history.History
}) => Promise<void>
