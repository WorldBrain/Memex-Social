import StorageManager from "@worldbrain/storex";
import AuthStorage from "./modules/auth";
import UserStorage from "./modules/users";

export interface Storage {
    manager: StorageManager
    modules: StorageModules
}

export interface StorageModules {
    // auth : AuthStorage
    users: UserStorage
}
