import {
    SharedAnnotation,
    SharedAnnotationReference,
    SharedListEntryReference,
    SharedListReference,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import {
    UserReference,
    User,
} from '@worldbrain/memex-common/lib/web-interface/types/users'
import { UIEvent } from '../../../../../main-ui/classes/logic'
import { UIElementServices } from '../../../../../services/types'
import { StorageModules } from '../../../../../storage/types'
import { UITaskState } from '../../../../../main-ui/types'
import {
    ListsSidebarState,
    ListsSidebarEvent,
} from '../../../../lists-sidebar/ui/types'
import type {
    ExtDetectionState,
    ExtDetectionEvent,
} from '../../../../ext-detection/ui/logic'

export interface HomeFeedDependencies {
    services: UIElementServices<
        | 'contentConversations'
        | 'auth'
        | 'overlay'
        | 'activityStreams'
        | 'router'
        | 'userManagement'
        | 'webMonetization'
        | 'localStorage'
        | 'documentTitle'
        | 'userMessages'
        | 'memexExtension'
    >
    storage: Pick<
        StorageModules,
        | 'contentSharing'
        | 'contentConversations'
        | 'users'
        | 'activityStreams'
        | 'activityFollows'
    >
    listActivitiesLimit: number
}

export type HomeFeedState = {
    loadState: UITaskState
    needsAuth?: boolean
    activityItems: ActivityItem[]
    users: { [userId: string]: Pick<User, 'displayName'> | null }
    lastSeenTimestamp?: number | null
    shouldShowNewLine: boolean
    loadingIncludingUIFinished: boolean
} & (ListsSidebarState & ExtDetectionState)

export type HomeFeedEvent = UIEvent<
    // AnnotationConversationEvent &
    ListsSidebarEvent &
        ExtDetectionEvent & {
            clickPageResult: {
                urlToOpen: string
                preventOpening: () => void
                isFeed: boolean
            }
            waypointHit: null
            getLastSeenLinePosition: null
            loadingIncludingUIFinished: boolean
        }
>

export type ActivityItem =
    | PageActivityItem
    | ListActivityItem
    | AnnotationActivityItem

interface TopLevelActivityItem {
    groupId: string
    notifiedWhen: number
    activities: Array<{ notifiedWhen: number }>
}

export interface ListActivityItem extends TopLevelActivityItem {
    type: 'list-item'
    reason: 'pages-added-to-list'
    list: { title: string; reference: SharedListReference }
}

export interface PageActivityItem extends TopLevelActivityItem {
    type: 'page-item'
    reason: 'new-annotations'
    pageTitle?: string
    list?: {
        title: string
        reference: SharedListReference
        entry: SharedListEntryReference
    }
    normalizedPageUrl: string
    creatorReference: UserReference
}

export type AnnotationActivityItem = Omit<
    PageActivityItem,
    'type' | 'reason'
> & {
    type: 'annotation-item'
    reason: 'new-replies'
    annotation: { reference: SharedAnnotationReference } & Pick<
        SharedAnnotation,
        'body' | 'comment'
    >
}
