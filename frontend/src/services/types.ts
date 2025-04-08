import type { Services as SharedServices } from '@worldbrain/memex-common/lib/services/types'
import type { YoutubeService } from '@worldbrain/memex-common/lib/services/youtube'
import type { AuthService } from './auth/types'
import type FixtureService from './fixtures'
import type RouterService from './router'
import type { ScenarioService } from './scenarios'
import type { DocumentTitleService } from './document-title'
import type { ActivityStreamsService } from '@worldbrain/memex-common/lib/activity-streams/types'
import type { UserMessageService } from '@worldbrain/memex-common/lib/user-messages/service/types'
import type UserManagementService from '../features/user-management/service'
import type { LocalStorageService } from './local-storage/types'
import type { MemexExtensionService } from './memex-extension'
import type { AnalyticsService } from './analytics'
import type { SummarizationService } from '@worldbrain/memex-common/lib/summarization'
import type { LLMEndpointsService } from '@worldbrain/memex-common/lib/llm-endpoints'
import type { FullTextSearchService } from './full-text-search'
import type { PublicApiServiceInterface } from '@worldbrain/memex-common/lib/public-api/types'
import type { PdfUploadServiceInterface } from '@worldbrain/memex-common/lib/pdf/uploads/types'
import type { BlueskyServiceInterface } from '@worldbrain/memex-common/lib/bsky/service/types'
import type { AiChatServiceInterface } from '@worldbrain/memex-common/lib/ai-chat/service/types'
import { ThemeService } from './theme'
import { CacheService } from './cache'
import { EventEmitter } from '../utils/events'

type UIServices = 'logicRegistry' | 'device'
export type UIElementServices<Wanted extends keyof Services = never> = Pick<
    Services,
    UIServices | Wanted
>

export type Services = SharedServices & {
    router: RouterService
    aiChat: AiChatServiceInterface
    auth: AuthService
    bluesky: BlueskyServiceInterface
    fixtures: FixtureService
    scenarios: ScenarioService
    events: EventEmitter<any>
    cache: CacheService
    theme: ThemeService
    documentTitle: DocumentTitleService
    localStorage: LocalStorageService
    userMessages: UserMessageService
    youtube: YoutubeService
    memexExtension: MemexExtensionService
    analytics: AnalyticsService
    fullTextSearch: FullTextSearchService

    // Feature specific services
    aiChat: AiChatServiceInterface
    activityStreams: ActivityStreamsService
    userManagement: UserManagementService
    summarization: SummarizationService
    publicApi: PublicApiServiceInterface
    pdfUploadService: PdfUploadServiceInterface
}
