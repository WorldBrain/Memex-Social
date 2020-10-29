import { SharedAnnotationReference, SharedAnnotation, SharedPageInfoReference, SharedPageInfo } from "@worldbrain/memex-common/lib/content-sharing/types";
import UserStorage from "../../../../user-management/storage";
import { UIEvent, UISignal } from "../../../../../main-ui/classes/logic";
import ContentSharingStorage from "../../../storage";
import { UIElementServices } from "../../../../../main-ui/classes";
import ContentConversationStorage from "../../../../content-conversations/storage";
import { AnnotationConversationEvent, AnnotationConversationStates, AnnotationConversationsState } from "../../../../content-conversations/ui/types";
import { UITaskState } from "../../../../../main-ui/types";
import { User, UserReference } from "@worldbrain/memex-common/lib/web-interface/types/users";

export interface PageDetailsDependencies {
    services: UIElementServices<'contentConversations' | 'auth' | 'overlay'>;
    storage: {
        contentSharing: ContentSharingStorage,
        contentConversations: ContentConversationStorage
    }
    pageID: string
    userManagement: UserStorage
}

export type PageDetailsState = AnnotationConversationsState & {
    annotationLoadState: UITaskState
    annotations?: Array<SharedAnnotation & { reference: SharedAnnotationReference, linkId: string }> | null

    pageInfoLoadState: UITaskState
    pageInfoReference?: SharedPageInfoReference | null
    pageInfo?: SharedPageInfo | null

    creatorLoadState: UITaskState
    creator?: User | null
    creatorReference?: UserReference | null
}

export type PageDetailsEvent = UIEvent<AnnotationConversationEvent>

export type PageDetailsSignal = UISignal<
    { type: 'nothing-yet' }
>