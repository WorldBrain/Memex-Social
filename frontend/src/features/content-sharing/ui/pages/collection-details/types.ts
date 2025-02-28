import { UIEvent, UISignal } from '../../../../../main-ui/classes/logic'
import type {
    AnnotationConversationEvent,
    AnnotationConversationsState,
} from '../../../../content-conversations/ui/types'
import type {
    SharedListEntry,
    SharedList,
    SharedListRoleID,
    SharedListEntryReference,
    SharedListReference,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import type { DiscordList } from '@worldbrain/memex-common/lib/discord/types'
import type { UITaskState } from '../../../../../main-ui/types'
import type {
    UserReference,
    User,
} from '@worldbrain/memex-common/lib/web-interface/types/users'
import type { UIElementServices } from '../../../../../services/types'
import type { StorageModules } from '../../../../../storage/types'
import type {
    ExtDetectionState,
    ExtDetectionEvent,
} from '../../../../ext-detection/ui/logic'
import { SharedListRole } from '@worldbrain/memex-common/lib/web-interface/types/storex-generated/content-sharing'
import { ProcessSharedListKeyResult } from '@worldbrain/memex-common/lib/content-sharing/service/types'
import { SearchType } from '@worldbrain/memex-common/lib/common-ui/components/types'
import { ContentSharingQueryParams } from '../../../types'
import type { SlackList } from '@worldbrain/memex-common/lib/slack/types'
import type { CollectionDetailsDeniedData } from '@worldbrain/memex-common/lib/content-sharing/backend/types'
import type {
    EditableAnnotationsEvent,
    EditableAnnotationsState,
} from '../../../../annotations/ui/types'
import type StorageManager from '@worldbrain/storex'
import type { ImageSupportInterface } from '@worldbrain/memex-common/lib/image-support/types'
import type { BlueskyList } from '@worldbrain/memex-common/lib/bsky/storage/types'
import { CreationInfoProps } from '@worldbrain/memex-common/lib/common-ui/components/creation-info'

export interface CollectionDetailsDependencies {
    listID: string
    entryID?: string
    services: UIElementServices<
        | 'auth'
        | 'bluesky'
        | 'overlay'
        | 'listKeys'
        | 'contentSharing'
        | 'contentConversations'
        | 'activityStreams'
        | 'router'
        | 'activityStreams'
        | 'documentTitle'
        | 'userManagement'
        | 'localStorage'
        | 'clipboard'
        | 'userMessages'
        | 'youtube'
        | 'memexExtension'
        | 'summarization'
        | 'fullTextSearch'
    >
    storage: Pick<
        StorageModules,
        | 'contentSharing'
        | 'contentConversations'
        | 'users'
        | 'bluesky'
        | 'slack'
        | 'slackRetroSync'
        | 'discord'
        | 'discordRetroSync'
        | 'activityStreams'
        | 'activityFollows'
    >
    query: ContentSharingQueryParams
    storageManager: StorageManager
    imageSupport: ImageSupportInterface
    getRootElement: () => HTMLElement
}

export type CollectionDetailsState = AnnotationConversationsState &
    EditableAnnotationsState &
    ExtDetectionState & {
        listLoadState: UITaskState
        followLoadState: UITaskState
        hoverState: boolean
        permissionKeyState: UITaskState
        permissionKeyResult?: ProcessSharedListKeyResult
        showPermissionKeyIssue?: boolean
        requestingAuth?: boolean
        showDeniedNote?: boolean
        copiedLink?: boolean
        summarizeArticleLoadState: {
            [normalizedPageUrl: string]: UITaskState | undefined
        }
        articleSummary: { [normalizedPageUrl: string]: string }
        renderEmbedModal?: boolean
        isEmbedShareModalCopyTextShown: string
        imageSourceForPreview?: string

        // listRolesLoadState: UITaskState
        listRoleID?: SharedListRoleID
        listRoles?: Array<SharedListRole & { user: UserReference }>
        listKeyPresent?: boolean
        listRoleLimit: number | null // how many collaborators to show in the subtitle
        showMoreCollaborators: boolean
        isListOwner?: boolean
        scrollTop?: number
        scrolledComponent?: JSX.Element
        users: { [id: string]: CreationInfoProps['creatorInfo'] }
        searchQuery: string
        dateFilterVisible: boolean
        endDateFilterValue: string
        startDateFilterValue: string
        resultLoadingState: UITaskState
        paginateLoading: UITaskState
        textFieldValueState: string
        urlsToAddToSpace: {
            url: string
            status:
                | 'input'
                | 'queued'
                | 'adding'
                | 'success'
                | 'failed'
                | 'running'
        }[]
        importUrlDisplayMode:
            | 'input'
            | 'queued'
            | 'success'
            | 'failed'
            | 'running'
        actionBarSearchAndAddMode: 'AddLinks' | null

        annotationEntriesLoadState: UITaskState
        annotationLoadStates: { [normalizedPageUrl: string]: UITaskState }
        permissionDenied?: CollectionDetailsDeniedData & { hasKey: boolean }
        listData?: {
            reference: SharedListReference
            pageSize: number
            creatorReference?: UserReference
            creator?: Pick<User, 'displayName'> | null
            list: SharedList
            blueskyList: BlueskyList | null
            discordList: DiscordList | undefined | null
            slackList: SlackList | null
            isChatIntegrationSyncing?: boolean
            listEntries: Array<CollectionDetailsListEntry>
            listDescriptionState: 'fits' | 'collapsed' | 'expanded' | undefined
            listDescriptionTruncated: string | undefined
        }
        isCollectionFollowed: boolean
        allAnnotationExpanded: boolean
        isListShareModalShown: boolean
        pageAnnotationsExpanded: { [normalizedPageUrl: string]: boolean }
        searchType: SearchType
        showStartImportButton: boolean
    }

export interface PageEventArgs {
    pageId: string
    day: number
}

export type ResultHoverState = 'main-content' | 'footer' | null

export type CollectionDetailsEvent = UIEvent<
    AnnotationConversationEvent &
        EditableAnnotationsEvent &
        ExtDetectionEvent & {
            load: { isUpdate: boolean; listID?: string }
            processCollectionSwitch: {}
            toggleDescriptionTruncation: {}
            togglePageAnnotations: { normalizedUrl: string }
            toggleAllAnnotations: {}
            toggleListShareModal: {}
            loadListData: { isUpdate: boolean; listID: string }
            acceptInvitation: {}
            toggleDateFilters: null
            closePermissionOverlay: {}
            pageBreakpointHit: { entryIndex: number }
            clickFollowBtn: { pageToOpenPostFollow?: string }
            updateAddLinkField: { textFieldValue: string }
            openImageInPreview: { imageSource?: string }
            switchImportUrlDisplayMode:
                | 'input'
                | 'queued'
                | 'success'
                | 'failed'
            removeLinkFromImporterQueue: string
            setActionBarSearchAndAddMode: 'AddLinks' | null
            switchLinksAdderMode: 'linkList' | 'textField'
            addLinkToCollection: null
            toggleMoreCollaborators: {}
            hideMoreCollaborators: {}
            updateScrollState: { previousScrollTop: number }
            setPageHover: (PageEventArgs & { hover: ResultHoverState }) | any
            setSearchType: SearchType
            copiedLinkButton: null
            summarizeArticle: { entry: any }
            hideSummary: { entry: any }
            toggleEmbedModal: null
            toggleEmbedShareModalCopyText: { embedOrLink: string }
            loadSearchResults: {
                query: string
                sharedListIds: string
                endDateFilterValue: string
                startDateFilterValue: string
            }
            updateSearchQuery: { query: string; sharedListIds: string }
        }
>
export type CollectionDetailsListEntry = SharedListEntry & {
    id?: number | string
    reference?: SharedListEntryReference | any
    creator: UserReference
    hoverState?: boolean
    sourceUrl: string
}

export type CollectionDetailsSignal = UISignal<
    | { type: 'loading-started' }
    | { type: 'loaded-list-data'; success: boolean }
    | { type: 'loaded-annotation-entries'; success: boolean }
    | { type: 'annotation-loading-started' }
    | { type: 'loaded-annotations'; success: boolean }
>
