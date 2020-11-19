import { UIEvent, UISignal } from "../../../../../main-ui/classes/logic";
import { UIElementServices } from "../../../../../main-ui/classes";
import { AnnotationConversationEvent, AnnotationConversationsState, AnnotationConversationSignal } from "../../../../content-conversations/ui/types";
import { StorageModules } from "../../../../../storage/types";
import { UITaskState } from "../../../../../main-ui/types";
import { SharedAnnotationReference, SharedPageInfo, SharedAnnotation } from "@worldbrain/memex-common/lib/content-sharing/types";
import { ConversationReplyReference, ConversationReply } from "@worldbrain/memex-common/lib/content-conversations/types";
import { UserReference, User } from "@worldbrain/memex-common/lib/web-interface/types/users";

export interface NotificationCenterDependencies {
    services: UIElementServices<'contentConversations' | 'auth' | 'overlay' | 'activityStreams'>;
    storage: Pick<StorageModules, 'contentSharing' | 'contentConversations' | 'users'>
}

export type NotificationCenterState = {
    loadState: UITaskState
    notificationItems: Array<NotificationItem>
    pageInfo: NotificationData['pageInfo']
    annotations: NotificationData['annotations']
    replies: NotificationData['replies']
    users: { [userId: string]: Pick<User, 'displayName'> | null }
} & AnnotationConversationsState

export type NotificationCenterEvent = UIEvent<AnnotationConversationEvent>

export type NotificationCenterSignal = UISignal<
    { type: 'not-yet' }
>

export type NotificationItem = PageNotificationItem

export interface PageNotificationItem {
    type: 'page-item'
    normalizedPageUrl: string
    annotations: Array<AnnotationNotificationItem>
}

export interface AnnotationNotificationItem {
    type: 'annotation-item'
    reference: SharedAnnotationReference;
    replies: Array<{
        reference: ConversationReplyReference;
    }>;
}

export interface NotificationData {
    pageInfo: { [normalizedPageUrl: string]: Pick<SharedPageInfo, 'fullTitle' | 'originalUrl'> }
    annotations: { [annotationId: string]: Pick<SharedAnnotation, 'body' | 'comment' | 'updatedWhen'> & { linkId: string, creatorReference: UserReference } }
    replies: {
        [annotationId: string]: {
            [replyId: string]: {
                reference: ConversationReplyReference
                creatorReference: UserReference
                reply: Pick<ConversationReply, 'content' | 'createdWhen' | 'normalizedPageUrl'>
            }
        }
    }
}
