import { ImageSupportInterface } from '@worldbrain/memex-common/lib/image-support/types'
import { UIElementServices } from '../../../../services/types'
import { StorageModules } from '../../../../storage/types'
import { Logic } from '../../../../utils/logic'
import { executeTask, TaskState } from '../../../../utils/tasks'
import StorageManager from '@worldbrain/storex'

export interface ChatInputDependencies {
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
    sendMessage: (message: string) => void
}

export type ChatInputState = {
    loadState: TaskState
    message: string
}

export class ChatInputLogic extends Logic<ChatInputState> {
    constructor(public props: ChatInputDependencies) {
        super()
    }

    getInitialState = (): ChatInputState => ({
        loadState: 'pristine',
        message: '',
    })

    async initialize() {
        await executeTask(this, 'loadState', async () => {})
    }

    sendMessage = (message: string) => {
        this.props.sendMessage(message)
    }

    updateMessage = (message: string) => {
        this.setState({ message })
    }
}
