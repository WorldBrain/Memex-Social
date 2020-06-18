import StorageManager from "@worldbrain/storex";
import AuthStorage from "./modules/auth";
import UserStorage from "./modules/users";
import ProjectStorage from "./modules/projects";
import SubscriptionStorage from "./modules/subscriptions";

export interface Storage {
    manager : StorageManager
    modules : StorageModules
}

export interface StorageModules {
    auth : AuthStorage
    users : UserStorage
    projects : ProjectStorage
    subscriptions : SubscriptionStorage
}
