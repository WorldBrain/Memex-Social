import { SharedAnnotationReference } from "@worldbrain/memex-common/lib/content-sharing/types";
import UserStorage from "../../../../user-management/storage";
import { UIEvent, UISignal } from "../../../../../main-ui/classes/logic";
import ContentSharingStorage from "../../../storage";
import { UIElementServices } from "../../../../../main-ui/classes";
import ContentConversationStorage from "../../../../content-conversations/storage";

export interface PageDetailsDependencies {
    services: UIElementServices<'contentConversations' | 'auth'>;
    storage: {
        contentSharing: ContentSharingStorage,
        contentConversations: ContentConversationStorage
    }
    pageID: string
    userManagement: UserStorage
}

export type PageDetailsEvent = UIEvent<{
    initiateNewReplyToAnnotation: { annotationReference: SharedAnnotationReference }
    editNewReplyToAnnotation: { annotationReference: SharedAnnotationReference, content: string }
    cancelNewReplyToAnnotation: { annotationReference: SharedAnnotationReference }
    confirmNewReplyToAnnotation: { annotationReference: SharedAnnotationReference }
    toggleAnnotationReplies: { annotationReference: SharedAnnotationReference }
}>

export type PageDetailsSignal = UISignal<
    { type: 'nothing-yet' }
>