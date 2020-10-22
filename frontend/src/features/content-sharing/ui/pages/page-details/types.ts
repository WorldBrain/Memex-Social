import UserStorage from "../../../../user-management/storage";
import { UIEvent, UISignal } from "../../../../../main-ui/classes/logic";
import ContentSharingStorage from "../../../storage";
import { SharedAnnotationReference } from "@worldbrain/memex-common/lib/content-sharing/types";

export interface PageDetailsDependencies {
    pageID: string
    contentSharing: ContentSharingStorage
    userManagement: UserStorage
}

export type PageDetailsEvent = UIEvent<{
    initiateReplyToAnnotation: { annotationReference: SharedAnnotationReference }
    cancelReplyToAnnotation: { annotationReference: SharedAnnotationReference }
    confirmReplyToAnnotation: { annotationReference: SharedAnnotationReference }
    toggleAnnotationReplies: { annotationReference: SharedAnnotationReference }
}>

export type PageDetailsSignal = UISignal<
    { type: 'nothing-yet' }
>