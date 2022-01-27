import {
    SharedAnnotationReference,
    SharedPageInfo,
    SharedAnnotation,
    SharedListReference,
    SharedListEntryReference,
    SharedListEntry,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import {
    ConversationReplyReference,
    ConversationReply,
} from '@worldbrain/memex-common/lib/content-conversations/types'
import {
    UserReference,
    User,
} from '@worldbrain/memex-common/lib/web-interface/types/users'
import { UIEvent } from '../../../../../main-ui/classes/logic'
import { UIElementServices } from '../../../../../services/types'
import {
    AnnotationConversationEvent,
    AnnotationConversationsState,
} from '../../../../content-conversations/ui/types'
import { StorageModules } from '../../../../../storage/types'
import { UITaskState } from '../../../../../main-ui/types'
import { OrderedMap } from '../../../../../utils/ordered-map'
import {
    ListsSidebarState,
    ListsSidebarEvent,
} from '../../../../lists-sidebar/ui/types'

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
    activityItems: OrderedMap<ActivityItem>
    replies: ActivityData['replies']
    pageInfo: ActivityData['pageInfo']
    annotations: ActivityData['annotations']
    users: { [userId: string]: Pick<User, 'displayName'> | null }
    lastSeenTimestamp?: number | null
    moreRepliesLoadStates: { [groupId: string]: UITaskState }
} & AnnotationConversationsState &
    ListsSidebarState

export type HomeFeedEvent = UIEvent<
    AnnotationConversationEvent &
        ListsSidebarEvent & {
            waypointHit: null
            loadMoreReplies: {
                groupId: string
                annotationReference: SharedAnnotationReference
            }
            toggleListEntryActivityAnnotations: {
                groupId: string
                listReference: SharedListReference
                listEntryReference: SharedListEntryReference
            }
        }
>

export type ActivityItem = PageActivityItem | ListActivityItem

interface TopLevelActivityItem {
    groupId: string
    notifiedWhen: number
}

export interface ListActivityItem extends TopLevelActivityItem {
    type: 'list-item'
    reason: 'pages-added-to-list'
    listName: string
    listReference: SharedListReference
    entries: OrderedMap<ListEntryActivityItem & { creator: UserReference }>
}

export type ListEntryActivityItem = {
    type: 'list-entry-item'
    reference: SharedListEntryReference
    creator: UserReference
    activityTimestamp: number
    hasAnnotations?: boolean
    areAnnotationsShown?: boolean
    annotationsLoadState: UITaskState
    annotations: OrderedMap<AnnotationActivityItem>
} & Pick<SharedListEntry, 'entryTitle' | 'originalUrl' | 'normalizedUrl'>

export interface PageActivityItem extends TopLevelActivityItem {
    type: 'page-item'
    reason: 'new-replies' | 'new-annotations'
    list?: { title: string; reference: SharedListReference }
    normalizedPageUrl: string
    creatorReference: UserReference
    listReference: SharedListReference | null
    annotations: OrderedMap<AnnotationActivityItem>
}

export interface AnnotationActivityItem {
    type: 'annotation-item'
    reference: SharedAnnotationReference
    hasEarlierReplies: boolean
    replies: Array<{
        reference: ConversationReplyReference
    }>
}

export interface ActivityData {
    pageInfo: {
        [normalizedPageUrl: string]: Pick<
            SharedPageInfo,
            'fullTitle' | 'originalUrl'
        > & { creator?: UserReference }
    }
    // pageItems: { [normalizedPageUrl: string]: PageActivityItem }
    annotations: {
        [annotationId: string]: Pick<
            SharedAnnotation,
            'body' | 'comment' | 'normalizedPageUrl' | 'updatedWhen'
        > & { linkId: string; creatorReference: UserReference }
    }
    annotationItems: { [groupId: string]: AnnotationActivityItem }
    replies: {
        [groupId: string]: {
            [replyId: string]: {
                reference: ConversationReplyReference
                previousReplyReference: ConversationReplyReference | null
                creatorReference: UserReference
                reply: Pick<
                    ConversationReply,
                    'content' | 'createdWhen' | 'normalizedPageUrl'
                >
            }
        }
    }
    users: { [id: string]: Pick<User, 'displayName'> }
}
