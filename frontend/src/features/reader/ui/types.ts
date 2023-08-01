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
import type StorageManager from '@worldbrain/storex'
import { ContentSharingQueryParams } from '../../content-sharing/types'

export interface ReaderPageViewDependencies {
    services: UIElementServices<
        | 'auth'
        | 'contentConversations'
        | 'userMessages'
        | 'listKeys'
        | 'router'
        | 'overlay'
        | 'userManagement'
        | 'youtube'
        | 'memexExtension'
    >
    storage: Pick<
        StorageModules,
        'contentSharing' | 'contentConversations' | 'users'
    >
    storageManager: StorageManager
    listID: string
    entryID: string
    normalizeUrl: URLNormalizer
    generateServerId: GenerateServerID
    query: ContentSharingQueryParams
}

export type ReaderPageViewState = AnnotationConversationsState & {
    /**
     * This contains the direct link to the web page or remote PDF to load in the reader iframe.
     * That means for PDFs it's not meant to be the `memex.cloud/ct/` base locator URL! That can be
     * found in `listData.entry`.
     */
    sourceUrl: string | null
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
    annotationCreateState: {
        comment: string
        isCreating: boolean
        loadState: UITaskState
    }
    annotationEditStates: {
        [annotationId: string]: {
            comment: string
            isEditing: boolean
            loadState: UITaskState
        }
    }
    annotationHoverStates: {
        [annotationId: string]: {
            isHovering: boolean
        }
    }
    annotationEntryData: GetAnnotationListEntriesResult
    annotations: GetAnnotationsResult
    sidebarWidth: number
    collaborationKey: string | null
    currentUserReference: UserReference | null
    permissionsLoadState: UITaskState
    permissions: 'owner' | 'contributor' | null
    isYoutubeVideo: boolean
    reportURLSuccess: boolean
    showInstallTooltip: boolean
    joinListState: UITaskState
    joinListResult: ProcessSharedListKeyResult | null
    showShareMenu: boolean
    linkCopiedToClipBoard: boolean
    activeAnnotationId: AutoPk | null
    iframeLoadState: UITaskState
    showOptionsMenu: boolean
    showSidebar: boolean
    renderAnnotationInstructOverlay: boolean
}

export type ReaderPageViewEvent = UIEvent<AnnotationConversationEvent> & {
    setReaderContainerRef: { ref: HTMLDivElement | null }
    setSidebarRef: { ref: HTMLElement | null }
    setSidebarWidth: { width: number }
    clickAnnotationInSidebar: { annotationId: AutoPk }
    reportUrl: { url: string }
    openOriginalLink: null
    copyLink: { url: string | null }
    closeInstallTooltip: null
    showSharePageMenu: null
    setAnnotationCreating: { isCreating: boolean }
    cancelAnnotationCreate: null
    confirmAnnotationCreate: null
    changeAnnotationCreateComment: { comment: string }
    setAnnotationEditing: { annotationId: AutoPk; isEditing: boolean }
    setAnnotationHovering: { annotationId: AutoPk; isHovering: boolean }
    cancelAnnotationEdit: { annotationId: AutoPk }
    confirmAnnotationEdit: { annotationId: AutoPk }
    changeAnnotationEditComment: { annotationId: AutoPk; comment: string }
    installMemexClick: {
        sharedListReference: SharedListReference
        urlToOpen: string
    }
    toggleOptionsMenu: null
    toggleSidebar: boolean | null
    createYoutubeNote: {}
    hideAnnotationInstruct: null
}
