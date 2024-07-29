import type { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'
import type { User } from '@worldbrain/memex-common/lib/web-interface/types/users'
import type { UIEvent } from '../../main-ui/classes/logic'
import type { UIElementServices } from '../../services/types'
import type { StorageModules } from '../../storage/types'
import { ImageSupportInterface } from '@worldbrain/memex-common/lib/image-support/types'
import { YoutubePlayer } from '@worldbrain/memex-common/lib/services/youtube/types'
import { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import {
    AImodels,
    PromptData,
    PromptURL,
} from '@worldbrain/memex-common/lib/summarization/types'
import { CollectionDetailsMessageEvents } from '../content-sharing/ui/pages/collection-details/types'
import TypedEventEmitter from 'typed-emitter'

export interface AIChatWebUiWrapperDependencies {
    getRootElement: () => HTMLElement
    imageSupport: ImageSupportInterface
    getLocalContent?: () => Promise<string>
    getYoutubePlayer?: () => YoutubePlayer
    openImageInPreview: (imageSource: string) => Promise<void>
    analyticsBG: AnalyticsCoreInterface
    services: UIElementServices<'localStorage' | 'summarization'>
    collectionDetailsEvents:
        | TypedEventEmitter<CollectionDetailsMessageEvents>
        | undefined
    fetchContentList?: () => PromptURL[]
}

export interface AIChatWebUiWrapperState {
    currentAIResponse: string
    selectedModel: AImodels
    currentChatId: string
}

export type AIChatWebUiWrapperEvent = UIEvent<{
    queryAIService: {
        promptData: PromptData
        selectedModel: AImodels
    }
}>
