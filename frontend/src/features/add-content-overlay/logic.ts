import { ImageSupportInterface } from '@worldbrain/memex-common/lib/image-support/types'
import { UIElementServices } from '../../services/types'
import { StorageModules } from '../../storage/types'
import { Logic } from '../../utils/logic'
import { executeTask, TaskState } from '../../utils/tasks'
import StorageManager from '@worldbrain/storex'

export interface AddContentOverlayDependencies {
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
    handleDroppedFiles: (files: File[]) => Promise<void>
    handlePastedText: (text: string) => Promise<any>
    handleClose: () => void
}

export type AddContentOverlayState = {
    loadState: TaskState
}

export class AddContentOverlayLogic extends Logic<
    AddContentOverlayDependencies,
    AddContentOverlayState
> {
    getInitialState = (): AddContentOverlayState => ({
        loadState: 'pristine',
    })

    private pasteEventHandler = async (event: ClipboardEvent) => {
        const pastedText = event.clipboardData?.getData('text/plain')
        if (pastedText) {
            await this.handlePastedText(pastedText)
        }
    }

    private dragOverEventHandler = (event: DragEvent) => {
        event.preventDefault() // Prevent default behavior (opening file)
    }

    private dropEventHandler = async (event: DragEvent) => {
        event.preventDefault() // Prevent default behavior
        if (event.dataTransfer?.files) {
            const files = Array.from(event.dataTransfer.files)
            if (files.length > 0) {
                await this.handleDroppedFiles(files)
            }
        }
    }

    async initialize() {
        const rootElement = this.deps.getRootElement()
        rootElement.addEventListener('paste', this.pasteEventHandler)
        rootElement.addEventListener('dragover', this.dragOverEventHandler)
        rootElement.addEventListener('drop', this.dropEventHandler)

        await executeTask(this, 'loadState', async () => {
            // Initialization logic if needed
        })
    }

    async cleanup() {
        const rootElement = this.deps.getRootElement()
        rootElement.removeEventListener('paste', this.pasteEventHandler)
        rootElement.removeEventListener('dragover', this.dragOverEventHandler)
        rootElement.removeEventListener('drop', this.dropEventHandler)
    }

    // Method to handle dropped files
    async handleDroppedFiles(files: File[]) {
        this.deps.handleDroppedFiles(files)
    }

    // Method to handle pasted text
    async handlePastedText(text: string) {
        executeTask(this, 'loadState', async () => {
            await this.deps.handlePastedText(text)
            this.deps.handleClose()
        })
    }
}
