import { ImageSupportInterface } from '@worldbrain/memex-common/lib/image-support/types'
import { UIElementServices } from '../services/types'
import { StorageModules } from '../storage/types'
import { Logic } from '../utils/logic'
import { executeTask, TaskState } from '../utils/tasks'
import StorageManager from '@worldbrain/storex'

export interface NotesSidebarDependencies {
    services: UIElementServices<
        | 'auth'
        | 'bluesky'
        | 'overlay'
        | 'listKeys'
        | 'contentSharing'
        | 'contentConversations'
        | 'activityStreams'
        | 'router'
        | 'activityStreams'
        | 'documentTitle'
        | 'userManagement'
        | 'localStorage'
        | 'clipboard'
        | 'userMessages'
        | 'youtube'
        | 'memexExtension'
        | 'summarization'
        | 'fullTextSearch'
    >
    storage: Pick<
        StorageModules,
        | 'contentSharing'
        | 'contentConversations'
        | 'users'
        | 'bluesky'
        | 'slack'
        | 'slackRetroSync'
        | 'discord'
        | 'discordRetroSync'
        | 'activityStreams'
        | 'activityFollows'
    >
    imageSupport: ImageSupportInterface
    getRootElement: () => HTMLElement
    storageManager: StorageManager
}

export type NotesSidebarState = {
    loadState: TaskState
}

export class NotesSidebarLogic extends Logic<
    NotesSidebarDependencies,
    NotesSidebarState
> {
    getInitialState = (): NotesSidebarState => ({
        loadState: 'pristine',
    })

    async initialize() {
        await executeTask(this, 'loadState', async () => {})
    }
}
