import StorageManager from "@worldbrain/storex";
import AuthStorage from "./modules/auth";
import UserStorage from "./modules/users";
import ContentSharingStorage from "../features/content-sharing/storage";

export interface Storage {
    serverStorageManager: StorageManager
    serverModules: StorageModules
}

export interface StorageModules {
    // auth : AuthStorage
    users: UserStorage
    contentSharing: ContentSharingStorage
}
