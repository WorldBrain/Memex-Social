import type StorageManager from '@worldbrain/storex'
import type { ActivityStreamsStorage } from '@worldbrain/memex-common/lib/activity-streams/storage/types'
import type DiscordStorage from '@worldbrain/memex-common/lib/discord/storage'
import type SlackStorage from '@worldbrain/memex-common/lib/slack/storage'
import type { SlackRetroSyncStorage } from '@worldbrain/memex-common/lib/slack/storage/retro-sync'
import type UserStorage from '../features/user-management/storage'
import type ContentSharingStorage from '../features/content-sharing/storage'
import type ActivityFollowsStorage from '../features/activity-follows/storage'
import type ContentConversationStorage from '../features/content-conversations/storage'
import type PersonalCloudStorage from '@worldbrain/memex-common/lib/personal-cloud/storage'
import type { DiscordRetroSyncStorage } from '@worldbrain/memex-common/lib/discord/queue'
import type { BlueskyStorage } from '@worldbrain/memex-common/lib/bsky/storage'
import type { AiChatStorage } from '@worldbrain/memex-common/lib/ai-chat/storage'

export interface Storage {
    serverStorageManager: StorageManager
    serverModules: StorageModules
}

export interface StorageModules {
    users: UserStorage
    slack: SlackStorage
    slackRetroSync: SlackRetroSyncStorage
    bluesky: BlueskyStorage
    discord: DiscordStorage
    discordRetroSync: DiscordRetroSyncStorage
    contentSharing: ContentSharingStorage
    activityFollows: ActivityFollowsStorage
    contentConversations: ContentConversationStorage
    activityStreams: ActivityStreamsStorage
    personalCloud: PersonalCloudStorage
    aiChat: AiChatStorage
}
