import { UIEvent, UISignal } from "../../../../../main-ui/classes/logic";
import { UIElementServices } from "../../../../../main-ui/classes";
import { AnnotationConversationEvent, AnnotationConversationsState, AnnotationConversationSignal } from "../../../../content-conversations/ui/types";
import { StorageModules } from "../../../../../storage/types";
import { UITaskState } from "../../../../../main-ui/types";

export interface NotificationCenterDependencies {
    services: UIElementServices<'contentConversations' | 'auth' | 'overlay' | 'activityStreams'>;
    storage: Pick<StorageModules, 'contentSharing' | 'contentConversations' | 'users'>
}

export type NotificationCenterState = {
    loadState: UITaskState
}

export type NotificationCenterEvent = UIEvent<AnnotationConversationEvent>

export type NotificationCenterSignal = UISignal<
    { type: 'not-yet' }
>