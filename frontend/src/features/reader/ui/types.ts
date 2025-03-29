import type { ProcessSharedListKeyResult } from '@worldbrain/memex-common/lib/content-sharing/service/types'
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
import type { ContentSharingQueryParams } from '../../content-sharing/types'
import type {
    EditableAnnotationsEvent,
    EditableAnnotationsState,
} from '../../annotations/ui/types'
import type { ImageSupportInterface } from '@worldbrain/memex-common/lib/image-support/types'
import type {
    BlueskyList,
    BlueskyUser,
} from '@worldbrain/memex-common/lib/bsky/storage/types'
import { CreationInfoProps } from '@worldbrain/memex-common/lib/common-ui/components/creation-info'
import { CollectionDetailsData } from '@worldbrain/memex-common/lib/content-sharing/backend/types'

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
        | 'contentSharing'
    >
    storage: Pick<
        StorageModules,
        'contentSharing' | 'contentConversations' | 'users' | 'bluesky'
    >
    storageManager: StorageManager
    listID: string
    entryID?: string
    noteId?: string
    normalizeUrl: URLNormalizer
    pdfBlob?: Blob
    generateServerId: GenerateServerID
    query: ContentSharingQueryParams
    imageSupport: ImageSupportInterface
    getRootElement: () => HTMLElement
    toggleSinglePageAnnotations?: (normalizedUrl: string) => void
    openImageInPreview?: (imageSource: string) => Promise<void>
}

export type ReaderPageViewState = AnnotationConversationsState &
    EditableAnnotationsState & {
        /**
         * This contains the direct link to the web page or remote PDF to load in the reader iframe.
         * That means for PDFs it's not meant to be the `memex.cloud/ct/` base locator URL! That can be
         * found in `listData.entry`.
         */
        sourceUrl: string | null
        users: { [id: string]: CreationInfoProps['creatorInfo'] }
        listLoadState: UITaskState
        blueskyList: BlueskyList | null
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
        highlightCreateState: UITaskState
        sidebarWidth: number
        collaborationKey: string | null
        permissionsLoadState: UITaskState
        permissions: 'owner' | 'contributor' | null
        imageSourceForPreview: string | null
        isYoutubeVideo: boolean
        reportURLSuccess: boolean
        showInstallTooltip: boolean
        joinListState: UITaskState
        joinListResult: ProcessSharedListKeyResult | null
        showShareMenu: boolean
        linkCopiedToClipBoard: boolean
        activeAnnotationId: AutoPk | null | undefined
        iframeLoadState: UITaskState
        readerLoadState: UITaskState
        showOptionsMenu: boolean
        showSidebar: boolean
        renderAnnotationInstructOverlay: boolean
        showSupportChat: boolean
        preventInteractionsInIframe: boolean
        showDropPDFNotice: boolean
        openOriginalStatus: UITaskState
        overlayModalState:
            | 'installTools'
            | 'upgradePlan'
            | 'invitedForCollaboration'
            | 'installMemexForVideo'
            | null
    }

export type ReaderPageViewEvent = UIEvent<
    AnnotationConversationEvent &
        EditableAnnotationsEvent & {
            load: { isUpdate: boolean; listID?: string }
            setReaderContainerRef: { ref: HTMLDivElement | null }
            setSidebarRef: { ref: HTMLElement | null }
            setSidebarWidth: { width: number }
            setModalState: ReaderPageViewState['overlayModalState']
            clickAnnotationInSidebar: { annotationId: AutoPk }
            reportUrl: { url: string }
            openOriginalLink: null
            copyLink: { url: string | null }
            toggleSupportChat: null
            toggleClickBlocker: null
            closeInstallTooltip: null
            showInstallTooltip: null
            showSharePageMenu: null
            setAnnotationCreating: { isCreating: boolean }
            cancelAnnotationCreate: null
            confirmAnnotationCreate: null
            changeAnnotationCreateComment: {
                comment: string
            }
            hideDropZone: null
            installMemexClick: {
                sharedListReference: SharedListReference
                urlToOpen: string
            }
            toggleOptionsMenu: null
            toggleSidebar: boolean | null
            createYoutubeNote: {}
            hideAnnotationInstruct: null
            openImageInPreview: { imageSource: string | null }
        }
>
