import { UIEvent } from '../../../main-ui/classes/logic'
import { Services } from '../../../services/types'
import { Storage } from '../../../storage/types'
import { AnnotationConversationEvent } from '../../content-conversations/ui/types'

export interface ReaderPageViewDependencies {
    services: Services
    storage: Storage
    listID: string
    entryID: string
}
export interface ReaderPageViewState {}
export type ReaderPageViewEvent = UIEvent<AnnotationConversationEvent>
