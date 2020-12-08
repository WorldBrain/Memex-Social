import { UIEvent, UISignal } from "../../../../../main-ui/classes/logic";
import { UIElementServices } from "../../../../../main-ui/classes";
import { AnnotationConversationEvent, AnnotationConversationsState, AnnotationConversationSignal } from "../../../../content-conversations/ui/types";
import { StorageModules } from "../../../../../storage/types";
import { UITaskState } from "../../../../../main-ui/types";
import { SharedAnnotationReference, SharedPageInfo, SharedAnnotation } from "@worldbrain/memex-common/lib/content-sharing/types";
import { ConversationReplyReference, ConversationReply } from "@worldbrain/memex-common/lib/content-conversations/types";
import { UserReference, User } from "@worldbrain/memex-common/lib/web-interface/types/users";

export interface HomeFeedDependencies {
    services: UIElementServices<'contentConversations' | 'auth' | 'overlay' | 'activityStreams'>;
    storage: Pick<StorageModules, 'contentSharing' | 'contentConversations' | 'users'>
}

export type HomeFeedState = {
    loadState: UITaskState
    activityItems: Array<ActivityItem>
    pageInfo: ActivityData['pageInfo']
    annotations: ActivityData['annotations']
    replies: ActivityData['replies']
    users: { [userId: string]: Pick<User, 'displayName'> | null }
} & AnnotationConversationsState

export type HomeFeedEvent = UIEvent<AnnotationConversationEvent>

export type HomeFeedSignal = UISignal<
    { type: 'not-yet' }
>

export type ActivityItem = PageActivityItem

export interface PageActivityItem {
    type: 'page-item'
    reason: 'new-replies'
    normalizedPageUrl: string
    annotations: Array<AnnotationActivityItem>
}

export interface AnnotationActivityItem {
    type: 'annotation-item'
    reference: SharedAnnotationReference;
    replies: Array<{
        reference: ConversationReplyReference;
    }>;
}

export interface ActivityData {
    pageInfo: { [normalizedPageUrl: string]: Pick<SharedPageInfo, 'fullTitle' | 'originalUrl'> }
    pageItems: { [normalizedPageUrl: string]: PageActivityItem }
    annotations: { [annotationId: string]: Pick<SharedAnnotation, 'body' | 'comment' | 'normalizedPageUrl' | 'updatedWhen'> & { linkId: string, creatorReference: UserReference } }
    annotationItems: { [annotationId: string]: AnnotationActivityItem }
    replies: {
        [annotationId: string]: {
            [replyId: string]: {
                reference: ConversationReplyReference
                creatorReference: UserReference
                reply: Pick<ConversationReply, 'content' | 'createdWhen' | 'normalizedPageUrl'>,
            }
        }
    }
}
