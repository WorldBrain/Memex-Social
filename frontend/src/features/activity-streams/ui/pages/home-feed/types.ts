import { SharedAnnotationReference, SharedPageInfo, SharedAnnotation, SharedListReference } from "@worldbrain/memex-common/lib/content-sharing/types";
import { ConversationReplyReference, ConversationReply } from "@worldbrain/memex-common/lib/content-conversations/types";
import { UserReference, User } from "@worldbrain/memex-common/lib/web-interface/types/users";
import { UIEvent, UISignal } from "../../../../../main-ui/classes/logic";
import { UIElementServices } from "../../../../../main-ui/classes";
import { AnnotationConversationEvent, AnnotationConversationsState } from "../../../../content-conversations/ui/types";
import { StorageModules } from "../../../../../storage/types";
import { UITaskState } from "../../../../../main-ui/types";
import { ActivityFollowsState, ActivityFollowsEvent } from "../../../../activity-follows/ui/types";

export interface HomeFeedDependencies {
    services: UIElementServices<'contentConversations' | 'auth' | 'overlay' | 'activityStreams' | 'router' | 'userManagement'>;
    storage: Pick<StorageModules, 'contentSharing' | 'contentConversations' | 'users' | 'activityStreams' | 'activityFollows'>
    listActivitiesLimit: number
}

export type HomeFeedState = {
    loadState: UITaskState
    activityItems: Array<ActivityItem>
    pageInfo: ActivityData['pageInfo']
    annotations: ActivityData['annotations']
    replies: ActivityData['replies']
    users: { [userId: string]: Pick<User, 'displayName'> | null }
    lastSeenTimestamp?: number | null
    moreRepliesLoadStates: { [groupId: string]: UITaskState }
} & AnnotationConversationsState & ActivityFollowsState

export type HomeFeedEvent = UIEvent<AnnotationConversationEvent & ActivityFollowsEvent & {
    waypointHit: null
    loadMoreReplies: {
        groupId: string
        annotationReference: SharedAnnotationReference
    }
>

export type ActivityItem = PageActivityItem | ListActivityItem

interface TopLevelActivityItem {
    groupId: string
    notifiedWhen: number
}

export interface ListActivityItem extends TopLevelActivityItem {
    type: 'list-item',
    reason: 'pages-added-to-list'
    listName: string
    listReference: SharedListReference
    entries: Array<ListEntryActivityItem>
}

// TODO: Maybe just replace this with `PageActivityItem`...
export interface ListEntryActivityItem {
    type: 'list-entry-item',
    entryTitle: string
    originalUrl: string
    normalizedPageUrl: string
    hasAnnotations?: boolean
    activityTimestamp: number
}

export interface PageActivityItem extends TopLevelActivityItem {
    type: 'page-item'
    reason: 'new-replies'
    normalizedPageUrl: string
    annotations: Array<AnnotationActivityItem>
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
        >
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
                creatorReference: UserReference
                reply: Pick<
                    ConversationReply,
                    'content' | 'createdWhen' | 'normalizedPageUrl'
                >
            }
        }
    }
}
