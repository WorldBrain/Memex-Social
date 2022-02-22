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
} from '@worldbrain/memex-common/lib/content-sharing/types'
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
import React from 'react'

export interface CollectionDetailsDependencies {
    listID: string
    services: UIElementServices<
        | 'auth'
        | 'overlay'
        | 'contentSharing'
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
    >
    storage: Pick<
        StorageModules,
        | 'contentSharing'
        | 'contentConversations'
        | 'users'
        | 'activityStreams'
        | 'activityFollows'
    >
}

export type CollectionDetailsState = AnnotationConversationsState &
    ListsSidebarState &
    ExtDetectionState & {
        listLoadState: UITaskState
        followLoadState: UITaskState

        permissionKeyState: UITaskState
        permissionKeyResult?: ProcessSharedListKeyResult
        showPermissionKeyIssue?: boolean
        requestingAuth?: boolean

        listRolesLoadState: UITaskState
        listRoleID?: SharedListRoleID
        listRoles?: Array<SharedListRole & { user: UserReference }>
        listRoleLimit: number | null // how many collaborators to show in the subtitle
        isListOwner?: boolean
        scrollTop?: number
        scrolledComponent?: JSX.Element
        users: { [id: string]: Pick<User, 'displayName'> }

        annotationEntriesLoadState: UITaskState
        annotationLoadStates: { [normalizedPageUrl: string]: UITaskState }
        listData?: {
            creatorReference?: UserReference
            creator?: Pick<User, 'displayName'> | null
            list: SharedList
            listEntries: Array<SharedListEntry & { creator: UserReference }>
            listDescriptionState: 'fits' | 'collapsed' | 'expanded'
            listDescriptionTruncated: string
        }
        isCollectionFollowed: boolean
        allAnnotationExpanded: boolean
        isListShareModalShown: boolean
        pageAnnotationsExpanded: { [normalizedPageUrl: string]: true }
        annotationEntryData?: GetAnnotationListEntriesResult
        annotations: GetAnnotationsResult
    }

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
            closePermissionOverlay: {}
            pageBreakpointHit: { entryIndex: number }
            clickFollowBtn: { pageToOpenPostFollow?: string }
            showMoreCollaborators: {}
            updateScrollState: (previousState) => {}
        }
>

export type CollectionDetailsSignal = UISignal<
    | { type: 'loading-started' }
    | { type: 'loaded-list-data'; success: boolean }
    | { type: 'loaded-annotation-entries'; success: boolean }
    | { type: 'annotation-loading-started' }
    | { type: 'loaded-annotations'; success: boolean }
>
