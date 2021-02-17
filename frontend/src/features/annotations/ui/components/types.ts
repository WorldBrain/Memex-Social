import { SharedAnnotation, SharedAnnotationReference } from "@worldbrain/memex-common/lib/content-sharing/types";

export type SharedAnnotationInPage = Pick<SharedAnnotation, 'body' | 'comment' | 'createdWhen'> & {
    reference: SharedAnnotationReference;
    linkId: string;
    hasThread?: boolean
};
