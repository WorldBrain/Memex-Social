import StorageManager from '@worldbrain/storex'
import { ActivityStreamsStorage } from '@worldbrain/memex-common/lib/activity-streams/storage/types'
import DiscordStorage from '@worldbrain/memex-common/lib/discord/storage'
import UserStorage from '../features/user-management/storage'
import ContentSharingStorage from '../features/content-sharing/storage'
import ActivityFollowsStorage from '../features/activity-follows/storage'
import ContentConversationStorage from '../features/content-conversations/storage'
import PersonalCloudStorage from '@worldbrain/memex-common/lib/personal-cloud/storage'

export interface Storage {
    serverStorageManager: StorageManager
    serverModules: StorageModules
}

export interface StorageModules {
    users: UserStorage
    discord: DiscordStorage
    contentSharing: ContentSharingStorage
    activityFollows: ActivityFollowsStorage
    contentConversations: ContentConversationStorage
    activityStreams: ActivityStreamsStorage
    personalCloud: PersonalCloudStorage
}
