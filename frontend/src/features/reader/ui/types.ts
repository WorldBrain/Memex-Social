import type { ProcessSharedListKeyResult } from '@worldbrain/memex-common/lib/content-sharing/service/types'
import type {
    GetAnnotationListEntriesResult,
    GetAnnotationsResult,
} from '@worldbrain/memex-common/lib/content-sharing/storage/types'
import type {
    SharedList,
    SharedListReference,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import type { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'
import type { User } from '@worldbrain/memex-common/lib/web-interface/types/users'
import type { UIEvent } from '../../../main-ui/classes/logic'
import type { UIElementServices } from '../../../services/types'
import type { StorageModules } from '../../../storage/types'
import type {
    AnnotationConversationEvent,
    AnnotationConversationsState,
} from '../../content-conversations/ui/types'
import type { CollectionDetailsListEntry } from '../../content-sharing/ui/pages/collection-details/types'
import type { UserReference } from '../../user-management/types'
import type { GenerateServerID } from '@worldbrain/memex-common/lib/content-sharing/service/types'
import type { URLNormalizer } from '@worldbrain/memex-common/lib/url-utils/normalize/types'
import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'

export interface ReaderPageViewDependencies {
    services: UIElementServices<
        | 'auth'
        | 'contentConversations'
        | 'userMessages'
        | 'listKeys'
        | 'router'
        | 'overlay'
        | 'userManagement'
    >
    storage: Pick<
        StorageModules,
        'contentSharing' | 'contentConversations' | 'users'
    >
    listID: string
    entryID: string
    normalizeUrl: URLNormalizer
    generateServerId: GenerateServerID
}

export type ReaderPageViewState = AnnotationConversationsState & {
    users: { [id: string]: Pick<User, 'displayName' | 'platform'> }
    listLoadState: UITaskState
    listData?: {
        reference: SharedListReference
        creatorReference: UserReference
        creator?: Pick<User, 'displayName'> | null
        list: SharedList
        entry: CollectionDetailsListEntry
        title: string
        url: string
    }
    annotationEntriesLoadState: UITaskState
    annotationLoadStates: { [normalizedPageUrl: string]: UITaskState }
    annotationEntryData: GetAnnotationListEntriesResult
    annotations: GetAnnotationsResult
    sidebarWidth: number
    isYoutubeVideo: boolean
    reportURLSuccess: boolean
    showInstallTooltip: boolean
    collaborationKey: string | null
    collaborationKeyLoadState: UITaskState
    joinListState: UITaskState
    joinListResult: ProcessSharedListKeyResult | null
    showShareMenu: boolean
    linkCopiedToClipBoard: boolean
    activeAnnotationId: AutoPk | null
    iframeLoadState: UITaskState
}

export type ReaderPageViewEvent = UIEvent<AnnotationConversationEvent> & {
    setReaderContainerRef: { ref: HTMLDivElement | null }
    setSidebarRef: { ref: HTMLElement | null }
    setSidebarWidth: { width: number }
    reportUrl: { url: string }
    copyLink: { url: string | null }
    closeInstallTooltip: null
    showSharePageMenu: null
    installMemexClick: {
        sharedListReference: SharedListReference
        urlToOpen: string
    }
}
