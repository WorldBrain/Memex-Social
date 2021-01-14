import StorageManager from "@worldbrain/storex";
import { ActivityStreamsStorage } from "@worldbrain/memex-common/lib/activity-streams/storage/types"
import UserStorage from "../features/user-management/storage";
import ContentSharingStorage from "../features/content-sharing/storage";
import ActivityFollowingStorage from "../features/activity-following/storage"
import ContentConversationStorage from "../features/content-conversations/storage";

export interface Storage {
    serverStorageManager: StorageManager
    serverModules: StorageModules
}

export interface StorageModules {
    users: UserStorage
    contentSharing: ContentSharingStorage
    activityFollowing: ActivityFollowingStorage
    contentConversations: ContentConversationStorage
    activityStreams: ActivityStreamsStorage
}
