import type {
    SharedAnnotation,
    SharedAnnotationReference,
    SharedListEntryReference,
    SharedListReference,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import type {
    UserReference,
    User,
} from '@worldbrain/memex-common/lib/web-interface/types/users'
import type { UIEvent } from '../../../../../main-ui/classes/logic'
import type { UIElementServices } from '../../../../../services/types'
import type { StorageModules } from '../../../../../storage/types'
import type { UITaskState } from '../../../../../main-ui/types'
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
} & ExtDetectionState

export type HomeFeedEvent = UIEvent<
    // AnnotationConversationEvent &
    ExtDetectionEvent & {
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
