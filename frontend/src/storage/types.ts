import StorageManager from "@worldbrain/storex";
import UserStorage from "../features/user-management/storage";
import ContentSharingStorage from "../features/content-sharing/storage";
import ContentConversationStorage from "../features/content-conversations/storage";

export interface Storage {
    serverStorageManager: StorageManager
    serverModules: StorageModules
}

export interface StorageModules {
    users: UserStorage
    contentSharing: ContentSharingStorage
    contentConversations: ContentConversationStorage
}
