import { ImageSupportInterface } from '@worldbrain/memex-common/lib/image-support/types'
import { UIElementServices } from '../../services/types'
import { StorageModules } from '../../storage/types'
import { Logic } from '../../utils/logic'
import { executeTask, TaskState } from '../../utils/tasks'
import StorageManager from '@worldbrain/storex'
import {
    AiChatReference,
    AiChatResponseChunk,
    AiChatResponseClient,
    AiChatThreadClient,
    GetAiChatResponseRequest,
} from '@worldbrain/memex-common/lib/ai-chat/service/types'
export interface AiChatDependencies {
    listId: string
    initialChatMessage: string | null
    services: UIElementServices<
        | 'auth'
        | 'aiChat'
        | 'events'
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

export type AiChatState = {
    loadState: TaskState
    thread: AiChatThreadClient | null
    references: AiChatReference[]
}

export class AiChatLogic extends Logic<AiChatState> {
    constructor(public props: AiChatDependencies) {
        super()
    }

    getInitialState = (): AiChatState => ({
        loadState: 'pristine',
        thread: null,
        references: [],
    })

    async initialize() {
        await executeTask(this, 'loadState', async () => {
            const threadId = this.generateChatId()
            const thread = {
                threadId: threadId,
                messages: [],
            } as AiChatThreadClient

            this.setState({ thread })
            if (this.props.initialChatMessage) {
                this.sendMessage(this.props.initialChatMessage)
            }
        })
    }

    generateChatId = () => {
        return `chat-${Date.now()}`
    }
    generateMessageId = () => {
        return `message-${Date.now()}`
    }

    sendMessage = async (message: string) => {
        const lastId = this.state.thread?.messages.length
            ? this.state.thread.messages[this.state.thread.messages.length - 1]
                  .messageId
            : 0

        const newMessage = {
            threadId: this.state.thread!.threadId,
            messageId: this.generateChatId(),
            message: message,
            role: 'user' as const,
            context: {
                spaceId: this.props.listId,
            },
        }

        const existingThread = this.state.thread

        if (!existingThread) {
            this.setState({
                thread: {
                    id: this.generateChatId(),
                    messages: [newMessage],
                },
            })
        } else {
            const updatedThread = {
                ...existingThread,
                messages: [...existingThread.messages, newMessage],
            }
            this.setState({ thread: updatedThread })
        }

        const userMessage: GetAiChatResponseRequest = {
            role: 'user',
            parentMessageId: null,
            threadId: this.state.thread!.threadId,
            messageId: newMessage.messageId.toString(),
            message: newMessage.message,
            options: {
                temperature: 0.5,
                model: 'gpt-4o-mini',
            },
            context: {
                sharedListIds: [this.props.listId],
                pageUrls: [],
                text: newMessage.message,
            },
        }

        const response = this.props.services.aiChat.getAiChatResponse({
            ...userMessage,
        })
        this.updateThread(userMessage, 'user')
        for await (const chunk of response) {
            console.log('chunk', chunk)
            this.updateThread(chunk as AiChatResponseChunk, 'assistant')
        }
    }

    updateThread = (
        message: AiChatResponseChunk | GetAiChatResponseRequest,
        type: 'assistant' | 'user',
    ) => {
        console.log('thread', this.state.thread)
        if (!this.state.thread) return
        if (type === 'assistant') {
            // Create a new array with all messages except the last one
            let messages = this.state.thread.messages
            let lastMessage = this.state.thread.messages[
                this.state.thread.messages.length - 1
            ]

            if (lastMessage.role === 'assistant') {
                messages = this.state.thread.messages.slice(0, -1)
            }

            // Add updated last message
            const updatedLastMessage: AiChatResponseClient = {
                role: 'assistant',
                messageId: lastMessage.messageId,
                message: [...lastMessage.message, message],
            }

            console.log('updatedLastMessage', updatedLastMessage)

            const updatedThread = {
                threadId: this.state.thread.threadId,
                messages: [...messages, updatedLastMessage],
            }
            this.setState({ thread: updatedThread })
            return
        }
        if (type === 'user') {
            const updatedThread = {
                threadId: this.state.thread.threadId,
                messages: [...this.state.thread.messages, message],
            }
            this.setState({ thread: updatedThread })
        }
    }

    openReference = async (reference: AiChatReference) => {
        console.log('reference2', reference)
        if (reference.type === 'page') {
        } else if (reference.type === 'annotation') {
            console.log('reference.reference', reference.id, this.props.listId)
            try {
                const annotationsResult = await this.props.services.contentSharing.backend.loadAnnotationsWithThreads(
                    {
                        listId: this.props.listId,
                        annotationIds: {
                            'en.wikipedia.org/wiki/World_Programme_for_the_Census_of_Agriculture': [
                                reference.id,
                            ],
                        },
                    },
                )

                console.log('annotationsResult', annotationsResult)
                const annotation = await this.props.storage.contentSharing.getAnnotation(
                    {
                        reference: {
                            id: reference.id,
                            type: 'shared-annotation-reference',
                        },
                    },
                )
                console.log('annotation', annotation)
            } catch (error) {
                console.error('error', error)
            }
        }
    }
}
