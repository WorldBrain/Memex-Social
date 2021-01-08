import { SharedAnnotationReference, SharedPageInfo, SharedAnnotation } from "@worldbrain/memex-common/lib/content-sharing/types";
import { ConversationReplyReference, ConversationReply } from "@worldbrain/memex-common/lib/content-conversations/types";
import { UserReference, User } from "@worldbrain/memex-common/lib/web-interface/types/users";
import { UIEvent, UISignal } from "../../../../../main-ui/classes/logic";
import { UIElementServices } from "../../../../../main-ui/classes";
import { AnnotationConversationEvent, AnnotationConversationsState } from "../../../../content-conversations/ui/types";
import { StorageModules } from "../../../../../storage/types";
import { UITaskState } from "../../../../../main-ui/types";

export interface HomeFeedDependencies {
    services: UIElementServices<'contentConversations' | 'auth' | 'overlay' | 'activityStreams' | 'router'>;
    storage: Pick<StorageModules, 'contentSharing' | 'contentConversations' | 'users' | 'activityStreams'>
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
} & AnnotationConversationsState

export type HomeFeedEvent = UIEvent<AnnotationConversationEvent & {
    waypointHit: null
    loadMoreReplies: {
        groupId: string
        annotationReference: SharedAnnotationReference
    }
}>

export type HomeFeedSignal = UISignal<
    { type: 'not-yet' }
>

export type ActivityItem = PageActivityItem

export interface PageActivityItem {
    type: 'page-item'
    groupId: string
    reason: 'new-replies'
    notifiedWhen: number
    normalizedPageUrl: string
    annotations: Array<AnnotationActivityItem>
}

export interface AnnotationActivityItem {
    type: 'annotation-item'
    reference: SharedAnnotationReference;
    hasEarlierReplies: boolean
    replies: Array<{
        reference: ConversationReplyReference;
    }>;
}

export interface ActivityData {
    pageInfo: { [normalizedPageUrl: string]: Pick<SharedPageInfo, 'fullTitle' | 'originalUrl'> }
    // pageItems: { [normalizedPageUrl: string]: PageActivityItem }
    annotations: { [annotationId: string]: Pick<SharedAnnotation, 'body' | 'comment' | 'normalizedPageUrl' | 'updatedWhen'> & { linkId: string, creatorReference: UserReference } }
    annotationItems: { [groupId: string]: AnnotationActivityItem }
    replies: {
        [groupId: string]: {
            [replyId: string]: {
                reference: ConversationReplyReference
                creatorReference: UserReference
                reply: Pick<ConversationReply, 'content' | 'createdWhen' | 'normalizedPageUrl'>,
            }
        }
    }
}