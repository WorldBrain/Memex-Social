import { UIEvent, UISignal } from "../../../../../main-ui/classes/logic";
import { AnnotationConversationEvent, AnnotationConversationsState } from "../../../../content-conversations/ui/types";
import { GetAnnotationsResult, GetAnnotationListEntriesResult } from "@worldbrain/memex-common/lib/content-sharing/storage/types";
import { SharedListEntry, SharedList } from "@worldbrain/memex-common/lib/content-sharing/types";
import { UITaskState } from "../../../../../main-ui/types";
import { UserReference, User } from "@worldbrain/memex-common/lib/web-interface/types/users";
import { UIElementServices } from "../../../../../main-ui/classes";
import { StorageModules } from "../../../../../storage/types";

export interface CollectionDetailsDependencies {
    listID: string
    services: UIElementServices<'auth' | 'overlay' | 'contentConversations'>
    storage: Pick<StorageModules, 'contentSharing' | 'contentConversations' | 'users'>
}

export type CollectionDetailsState = AnnotationConversationsState & {
    listLoadState: UITaskState
    annotationEntriesLoadState: UITaskState
    annotationLoadStates: { [normalizedPageUrl: string]: UITaskState }
    listData?: {
        creatorReference?: UserReference
        creator?: Pick<User, 'displayName'> | null
        list: SharedList
        listEntries: SharedListEntry[]
        listDescriptionState: 'fits' | 'collapsed' | 'expanded'
        listDescriptionTruncated: string
    },
    allAnnotationExpanded: boolean
    pageAnnotationsExpanded: { [normalizedPageUrl: string]: true }
    annotationEntryData?: GetAnnotationListEntriesResult
    annotations: GetAnnotationsResult
}

export type CollectionDetailsEvent = UIEvent<AnnotationConversationEvent & {
    toggleDescriptionTruncation: {}
    togglePageAnnotations: { normalizedUrl: string }
    toggleAllAnnotations: {}
    pageBreakpointHit: { entryIndex: number }
}>

export type CollectionDetailsSignal = UISignal<
    | { type: 'loading-started' }
    | { type: 'loaded-list-data', success: boolean }
    | { type: 'loaded-annotation-entries', success: boolean }
    | { type: 'annotation-loading-started' }
    | { type: 'loaded-annotations', success: boolean }
>