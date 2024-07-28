import {
    AIChatWebUiWrapperEvent,
    AIChatWebUiWrapperDependencies,
    AIChatWebUiWrapperState,
} from './types'
import { UIEventHandler, UILogic } from 'ui-logic-core'
import replaceImgSrcWithFunctionOutputNode from '@worldbrain/memex-common/lib/annotations/replaceImgSrcWithCloudAddressNode'
import { EventEmitter } from 'events'
import TypedEventEmitter from 'typed-emitter'
import { CollectionDetailsMessageEvents } from '../content-sharing/ui/pages/collection-details/types'

type EventHandler<
    EventName extends keyof AIChatWebUiWrapperEvent
> = UIEventHandler<AIChatWebUiWrapperState, AIChatWebUiWrapperEvent, EventName>

export default class AIChatWebUiWrapperLogic extends UILogic<
    AIChatWebUiWrapperState,
    AIChatWebUiWrapperEvent
> {
    public events = new EventEmitter() as TypedEventEmitter<CollectionDetailsMessageEvents>

    constructor(private dependencies: AIChatWebUiWrapperDependencies) {
        super()
    }

    init: EventHandler<'init'> = async () => {}

    getInitialState(): AIChatWebUiWrapperState {
        return {
            currentAIResponse: '',
            selectedModel: 'gpt-4o-mini',
            currentChatId: '',
        }
    }

    private ongoingRequests: Map<string, { cancel: () => void }> = new Map()
    private tokenBuffer = ''
    private isPageSummaryEmpty = true

    queryAIService: EventHandler<'queryAIService'> = async ({
        event,
        previousState,
    }) => {
        if (previousState.selectedModel !== event.selectedModel) {
            this.emitMutation({
                selectedModel: { $set: event.selectedModel },
            })
        }

        // resetting the buffers
        this.isPageSummaryEmpty = true
        this.tokenBuffer = ''
        const chatId: string = event.promptData.chatId
        let promptData = event.promptData
        let outputLocation = event.outputLocation ?? null

        this.emitMutation({
            currentChatId: { $set: chatId },
        })

        // Cancel any existing request for this messageId
        if (this.ongoingRequests?.has(chatId)) {
            this.ongoingRequests.get(chatId).cancel()
        }

        // Create a new controller for the current request
        let isCancelled = false
        const cancel = () => {
            isCancelled = true
        }

        // Store the cancel function in the map
        this.ongoingRequests.set(chatId, { cancel })

        promptData.context.originalFullMessage = replaceImgSrcWithFunctionOutputNode(
            promptData.context.originalFullMessage ?? '',
            process.env.NODE_ENV,
        )

        try {
            let isPageSummaryEmpty = true
            for await (const result of this.dependencies.services.summarization.queryAI(
                undefined,
                undefined,
                promptData.userPrompt,
                undefined,
                true,
                'gpt-4o-mini',
                promptData,
            )) {
                const token = result?.t

                let newToken = token
                if (isPageSummaryEmpty) {
                    newToken = newToken.trimStart() // Remove the first two characters
                }

                isPageSummaryEmpty = false

                if (!isCancelled) {
                    this.emitMutation({
                        currentAIResponse: {
                            $apply: (prev) => (prev || '') + newToken,
                        },
                    })
                }
            }
        } catch (error) {
            if (isCancelled) {
                console.log('Request was cancelled')
            } else {
                throw error
            }
        } finally {
            // Remove the request from the map
            this.ongoingRequests.delete(chatId)
        }
    }
}
