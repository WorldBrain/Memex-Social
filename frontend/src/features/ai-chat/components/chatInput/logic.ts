import { ImageSupportInterface } from '@worldbrain/memex-common/lib/image-support/types'
import { UIElementServices } from '../../../../services/types'
import { StorageModules } from '../../../../storage/types'
import { Logic } from '../../../../utils/logic'
import { executeTask, TaskState } from '../../../../utils/tasks'
import StorageManager from '@worldbrain/storex'
import { AvailableModels } from '@worldbrain/memex-common/lib/ai-chat/constants'

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
    showModelSelector: boolean
    selectedModel: typeof AvailableModels[number]
    editorOptionsExpanded: boolean
}

export class ChatInputLogic extends Logic<
    ChatInputDependencies,
    ChatInputState
> {
    getInitialState = (): ChatInputState => ({
        loadState: 'pristine',
        message: '',
        showModelSelector: false,
        selectedModel: AvailableModels[0],
        editorOptionsExpanded: false,
    })

    async initialize() {
        await executeTask(this, 'loadState', async () => {})
    }

    sendMessage = (message: string) => {
        this.deps.sendMessage(message)
    }

    setSelectedModel = (model: typeof AvailableModels[number]) => {
        this.setState({ selectedModel: model })
    }

    setShowModelSelector = (show: boolean) => {
        this.setState({ showModelSelector: show })
    }

    focusEditor = () => {
        this.setState({ editorOptionsExpanded: true })
    }

    updateMessage = (message: string) => {
        this.setState({ message })
    }
}
