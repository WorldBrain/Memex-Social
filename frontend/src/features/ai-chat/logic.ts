import { ImageSupportInterface } from '@worldbrain/memex-common/lib/image-support/types'
import { UIElementServices } from '../../services/types'
import { StorageModules } from '../../storage/types'
import { Logic } from '../../utils/logic'
import { executeTask, TaskState } from '../../utils/tasks'
import StorageManager from '@worldbrain/storex'
import {
    AiChatMessageAssistantClient,
    AiChatMessageUserClient,
    AiChatModels,
    AiChatResponseChunk,
    AiChatThreadClient,
    StreamAiChatReplyRequest,
    ContentBlock,
} from '@worldbrain/memex-common/lib/ai-chat/service/types'
import {
    AvailableModels,
    LOCAL_STORAGE_MODEL_KEY,
    mockChunks,
} from '@worldbrain/memex-common/lib/ai-chat/constants'
import {
    AiChatMessageContext,
    AiChatThread,
} from '@worldbrain/memex-common/lib/web-interface/types/storex-generated/ai-chat'
import { AiChatThreadReference } from '@worldbrain/memex-common/lib/ai-chat/storage/types'

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

function isValidModel(model: string | null): model is AiChatModels {
    return model != null && AvailableModels.some((m) => m.id === model)
}

export type AiChatState = {
    loadState: TaskState
    thread: AiChatThreadClient | null
    references: AiChatThreadReference[]
    model: AiChatModels
    editingMessageId: string | null
    context: AiChatMessageContext[] | null
}
export class AiChatLogic extends Logic<AiChatDependencies, AiChatState> {
    getInitialState = (): AiChatState => ({
        loadState: 'pristine',
        thread: null,
        references: [],
        model: 'gpt-4o-mini',
        editingMessageId: null,
        context: null,
    })

    async initialize() {
        await executeTask(this, 'loadState', async () => {
            const threadId = this.generateChatId()
            const thread = {
                threadId: threadId,
                messages: [],
            }

            this.setState({ thread })
            if (this.deps.initialChatMessage) {
                await this.sendMessage(this.deps.initialChatMessage)
            }

            const storedModel = localStorage.getItem(LOCAL_STORAGE_MODEL_KEY)
            if (isValidModel(storedModel)) {
                this.setState({ model: storedModel })
            }
        })
    }

    async *mockAiChatResponse(): AsyncGenerator<AiChatResponseChunk> {
        for (const chunk of mockChunks) {
            await new Promise((resolve) => setTimeout(resolve, 500))
            yield chunk
        }
    }

    async getAiChatResponseWithMock(
        userMessage: StreamAiChatReplyRequest,
        useMock: boolean = true,
    ): Promise<AsyncIterableIterator<AiChatResponseChunk>> {
        if (useMock) {
            return this.mockAiChatResponse()
        }
        return this.deps.services.aiChat.streamAiChatReply(userMessage)
    }

    generateChatId = () => {
        return `chat-${Date.now()}`
    }

    generateMessageId = (role: 'user' | 'assistant') => {
        return `${role}-${Date.now()}`
    }

    sendMessage = async (message: string) => {
        if (!this.state.thread) {
            return
        }

        const lastMessageId =
            this.state.thread.messages[this.state.thread.messages.length - 1]
                ?.messageId ?? null

        const newUserMessage: AiChatMessageUserClient = {
            messageId: this.generateMessageId('user'),
            content: message,
            role: 'user',
            model: this.state.model,
            temperature: 1,
            context: {
                sharedListIds: [this.deps.listId],
            },
            createdWhen: Date.now(),
        }

        const existingThread = this.state.thread

        const updatedThread = {
            ...existingThread,
            messages: [...existingThread.messages, newUserMessage],
        }
        this.setState({ thread: updatedThread })

        const assistantMessageId = this.generateMessageId('assistant')

        const userMessage: StreamAiChatReplyRequest = {
            threadId: this.state.thread.threadId,
            parentMessageId: lastMessageId ?? null,
            userMessageId: this.generateMessageId('user'),
            assistantMessageId: assistantMessageId,
            content: newUserMessage.content as string,
            model: 'gpt-4o-mini',
            sharedListIds: [this.deps.listId],
        }

        const response = await this.getAiChatResponseWithMock(
            userMessage,
            false,
        )

        let assistantMessage: AiChatMessageAssistantClient = {
            role: 'assistant',
            messageId: assistantMessageId,
            content: '',
            contentBlocks: [],
            model: this.state.model,
            temperature: 1,
            parentId: newUserMessage.messageId,
            createdWhen: Date.now(),
        }

        this.setState({
            thread: {
                ...this.state.thread,
                messages: [...this.state.thread.messages, assistantMessage],
            },
        })

        let responseString: string = ''
        let buffer: string = ''
        let inMarkdownLink: boolean = false
        let hasClosingBracket: boolean = false
        // let contentBlocks: ContentBlock[] = this.state.thread.messages[
        //     this.state.thread.messages.length - 1
        // ].contentBlocks
        let headerType: 'h1' | 'h2' | null = 'h1'
        let referenceIndex = 1

        for await (const chunk of response) {
            if (!chunk.done) {
                if (chunk.type === 'context') {
                    this.setState({
                        context: chunk.value,
                    })
                } else {
                    if (chunk.value.includes('[')) {
                        buffer += chunk.value
                        inMarkdownLink = true
                    } else if (inMarkdownLink) {
                        buffer += chunk.value
                        if (!hasClosingBracket && chunk.value.includes(']')) {
                            hasClosingBracket = true
                        }

                        if (hasClosingBracket && buffer.includes(')')) {
                            inMarkdownLink = false
                            hasClosingBracket = false

                            const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/
                            const match = buffer.match(linkRegex)
                            if (match) {
                                const url = match[2]
                                buffer = buffer.replace(
                                    linkRegex,
                                    `[${referenceIndex}](${url})`,
                                )
                            }

                            referenceIndex++
                            responseString += buffer
                            buffer = ''
                        }
                    } else {
                        responseString += chunk.value
                    }
                    //  else {
                    //     if (buffer.includes('# ')) {
                    //         headerType = 'h1'
                    //     }
                    //     if (buffer.includes('## ') || buffer.includes('### ')) {
                    //         headerType = 'h2'
                    //     }
                    //     console.log('headerType', headerType)
                    //     if (headerType != null) {
                    //         contentBlocks[contentBlocks.length - 1] = {
                    //             type: headerType,
                    //             value: buffer,
                    //         }
                    //     } else {
                    //         contentBlocks[contentBlocks.length - 1] = {
                    //             type: 'paragraph',
                    //             value: buffer,
                    //         }
                    //     }
                    // }
                }
            } else {
                if (chunk.error != null) {
                    console.log('chunk error', chunk.error)
                }
            }

            if (!inMarkdownLink) {
                this.setState({
                    thread: {
                        ...this.state.thread,
                        messages: this.state.thread.messages.map((msg) =>
                            msg.messageId === assistantMessage.messageId
                                ? {
                                      ...msg,
                                      content: responseString,
                                  }
                                : msg,
                        ),
                    },
                })
            }
        }
    }

    openReference = async (referenceText: string) => {
        const referenceComponents = referenceText.split(':')
        const referenceType = referenceComponents[0]
        const referenceId = referenceComponents[1]

        const reference = this.state.context?.find(
            (context) => context.id === referenceId,
        )

        this.deps.services.events.emit({
            openReference: reference,
        })
    }

    async setModel(model: AiChatModels) {
        this.setState({ model })
    }

    editMessage = (messageId: string) => {
        this.setState({ editingMessageId: messageId })
    }

    cancelEdit = () => {
        this.setState({ editingMessageId: null })
    }

    updateMessage = async (messageId: string, newContent: string) => {
        if (!this.state.thread) {
            return
        }

        const updatedThread = {
            ...this.state.thread,
            messages: this.state.thread.messages.map((msg) =>
                msg.messageId === messageId
                    ? { ...msg, content: newContent }
                    : msg,
            ),
        }

        this.setState({
            thread: updatedThread,
            editingMessageId: null,
        })
    }
}
