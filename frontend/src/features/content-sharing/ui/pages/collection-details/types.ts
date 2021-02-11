import { UIEvent, UISignal } from "../../../../../main-ui/classes/logic";
import {
  AnnotationConversationEvent,
  AnnotationConversationsState,
} from "../../../../content-conversations/ui/types";
import {
  GetAnnotationsResult,
  GetAnnotationListEntriesResult,
} from "@worldbrain/memex-common/lib/content-sharing/storage/types";
import {
  SharedListEntry,
  SharedList,
  SharedListReference,
} from "@worldbrain/memex-common/lib/content-sharing/types";
import { UITaskState } from "../../../../../main-ui/types";
import {
  UserReference,
  User,
} from "@worldbrain/memex-common/lib/web-interface/types/users";
import { UIElementServices } from "../../../../../main-ui/classes";
import { StorageModules } from "../../../../../storage/types";
import {
  ActivityFollowsState,
  ActivityFollowsEvent,
} from "../../../../activity-follows/ui/types";

export interface CollectionDetailsDependencies {
  listID: string;
  services: UIElementServices<
    | "auth"
    | "overlay"
    | "contentConversations"
    | "activityStreams"
    | "router"
    | "activityStreams"
    | "userManagement"
  >;
  storage: Pick<
    StorageModules,
    | "contentSharing"
    | "contentConversations"
    | "users"
    | "activityStreams"
    | "activityFollows"
  >;
}

export type CollectionDetailsState = AnnotationConversationsState &
  ActivityFollowsState & {
    listLoadState: UITaskState;
    followLoadState: UITaskState;
    annotationEntriesLoadState: UITaskState;
    annotationLoadStates: { [normalizedPageUrl: string]: UITaskState };
    listData?: {
      creatorReference?: UserReference;
      creator?: Pick<User, "displayName"> | null;
      list: SharedList;
      listEntries: SharedListEntry[];
      listDescriptionState: "fits" | "collapsed" | "expanded";
      listDescriptionTruncated: string;
    };
    isCollectionFollowed: boolean;
    allAnnotationExpanded: boolean;
    pageAnnotationsExpanded: { [normalizedPageUrl: string]: true };
    annotationEntryData?: GetAnnotationListEntriesResult;
    annotations: GetAnnotationsResult;
  };

export type CollectionDetailsEvent = UIEvent<AnnotationConversationEvent & ActivityFollowsEvent & {
    toggleDescriptionTruncation: {}
    togglePageAnnotations: { normalizedUrl: string }
    toggleAllAnnotations: {}
    loadListData: { listID: string }
    pageBreakpointHit: { entryIndex: number }
    clickFollowBtn: null
}>

export type CollectionDetailsSignal = UISignal<
  | { type: "loading-started" }
  | { type: "loaded-list-data"; success: boolean }
  | { type: "loaded-annotation-entries"; success: boolean }
  | { type: "annotation-loading-started" }
  | { type: "loaded-annotations"; success: boolean }
>;
