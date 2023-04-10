import { Services } from '../../../services/types'
import { Storage } from '../../../storage/types'

export interface ReaderPageViewProps {
    services: Services
    storage: Storage
    listID: string
    entryID: string
}
