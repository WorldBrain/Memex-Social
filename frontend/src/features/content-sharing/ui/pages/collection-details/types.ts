import { UIEvent, UISignal } from '../../../../../main-ui/classes/logic'
import {
    AnnotationConversationEvent,
    AnnotationConversationsState,
} from '../../../../content-conversations/ui/types'
import {
    GetAnnotationsResult,
    GetAnnotationListEntriesResult,
} from '@worldbrain/memex-common/lib/content-sharing/storage/types'
import {
    SharedListEntry,
    SharedList,
    SharedListRoleID,
    SharedListEntryReference,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import type { DiscordList } from '@worldbrain/memex-common/lib/discord/types'
import { UITaskState } from '../../../../../main-ui/types'
import {
    UserReference,
    User,
} from '@worldbrain/memex-common/lib/web-interface/types/users'
import { UIElementServices } from '../../../../../services/types'
import { StorageModules } from '../../../../../storage/types'
import {
    ListsSidebarState,
    ListsSidebarEvent,
} from '../../../../lists-sidebar/ui/types'
import type {
    ExtDetectionState,
    ExtDetectionEvent,
} from '../../../../ext-detection/ui/logic'
import { SharedListRole } from '@worldbrain/memex-common/lib/web-interface/types/storex-generated/content-sharing'
import { ProcessSharedListKeyResult } from '@worldbrain/memex-common/lib/content-sharing/service/types'
import { SearchType } from '@worldbrain/memex-common/lib/common-ui/components/types'
import { ContentSharingQueryParams } from '../../../types'

export interface CollectionDetailsDependencies {
    listID: string
    entryID?: string
    services: UIElementServices<
        | 'auth'
        | 'overlay'
        | 'listKeys'
        | 'contentConversations'
        | 'activityStreams'
        | 'router'
        | 'activityStreams'
        | 'documentTitle'
        | 'userManagement'
        | 'webMonetization'
        | 'localStorage'
        | 'clipboard'
        | 'userMessages'
        | 'youtube'
        | 'memexExtension'
        | 'fullTextSearch'
    >
    storage: Pick<
        StorageModules,
        | 'contentSharing'
        | 'contentConversations'
        | 'users'
        | 'discord'
        | 'discordRetroSync'
        | 'activityStreams'
        | 'activityFollows'
    >
    query: ContentSharingQueryParams
}

export type CollectionDetailsState = AnnotationConversationsState &
    ListsSidebarState &
    ExtDetectionState & {
        listLoadState: UITaskState
        followLoadState: UITaskState
        hoverState: boolean
        permissionKeyState: UITaskState
        permissionKeyResult?: ProcessSharedListKeyResult
        showPermissionKeyIssue?: boolean
        requestingAuth?: boolean
        copiedLink?: boolean
        renderEmbedModal?: boolean
        isEmbedShareModalCopyTextShown: string

        listRolesLoadState: UITaskState
        listRoleID?: SharedListRoleID
        listRoles?: Array<SharedListRole & { user: UserReference }>
        listKeyPresent?: boolean
        listRoleLimit: number | null // how many collaborators to show in the subtitle
        showMoreCollaborators: boolean
        isListOwner?: boolean
        scrollTop?: number
        scrolledComponent?: JSX.Element
        users: { [id: string]: Pick<User, 'displayName' | 'platform'> }
        searchQuery: string

        annotationEntriesLoadState: UITaskState
        annotationLoadStates: { [normalizedPageUrl: string]: UITaskState }
        listData?: {
            creatorReference?: UserReference
            creator?: Pick<User, 'displayName'> | null
            list: SharedList
            discordList: DiscordList | undefined | null
            isDiscordSyncing?: boolean
            listEntries: Array<
                SharedListEntry & {
                    reference?: SharedListEntryReference
                    id?: number | string
                } & {
                    creator: UserReference
                    hoverState?: boolean
                    id?: string | number
                }
            >
            listDescriptionState: 'fits' | 'collapsed' | 'expanded' | undefined
            listDescriptionTruncated: string | undefined
        }
        isCollectionFollowed: boolean
        allAnnotationExpanded: boolean
        isListShareModalShown: boolean
        pageAnnotationsExpanded: { [normalizedPageUrl: string]: boolean }
        annotationEntryData?: GetAnnotationListEntriesResult
        annotations: GetAnnotationsResult
        searchType: SearchType
    }

export interface PageEventArgs {
    pageId: string
    day: number
}

export type ResultHoverState = 'main-content' | 'footer' | null

export type CollectionDetailsEvent = UIEvent<
    AnnotationConversationEvent &
        ListsSidebarEvent &
        ExtDetectionEvent & {
            load: { isUpdate?: boolean; listID?: string }
            processCollectionSwitch: {}
            toggleDescriptionTruncation: {}
            togglePageAnnotations: { normalizedUrl: string }
            toggleAllAnnotations: {}
            toggleListShareModal: {}
            loadListData: { listID: string }
            processPermissionKey: {}
            acceptInvitation: {}
            closePermissionOverlay: {}
            pageBreakpointHit: { entryIndex: number }
            clickFollowBtn: { pageToOpenPostFollow?: string }
            toggleMoreCollaborators: {}
            hideMoreCollaborators: {}
            updateScrollState: { previousScrollTop: number }
            setPageHover: (PageEventArgs & { hover: ResultHoverState }) | any
            setSearchType: SearchType
            copiedLinkButton: null
            toggleEmbedModal: null
            toggleEmbedShareModalCopyText: { embedOrLink: string }
            loadSearchResults: { query: string; sharedListIds: string }
            updateSearchQuery: { query: string; sharedListIds: string }
        }
>

export type CollectionDetailsSignal = UISignal<
    | { type: 'loading-started' }
    | { type: 'loaded-list-data'; success: boolean }
    | { type: 'loaded-annotation-entries'; success: boolean }
    | { type: 'annotation-loading-started' }
    | { type: 'loaded-annotations'; success: boolean }
>
