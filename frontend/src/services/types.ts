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
import type WebMonetizationService from '../features/web-monetization/service'
import type { LocalStorageService } from './local-storage/types'
import type { MemexExtensionService } from './memex-extension'
import type { AnalyticsService } from './analytics'
import { SummarizationService } from './summarization'

type UIServices = 'logicRegistry' | 'device'
export type UIElementServices<Wanted extends keyof Services = never> = Pick<
    Services,
    UIServices | Wanted
>

export type Services = SharedServices & {
    router: RouterService
    auth: AuthService
    fixtures: FixtureService
    scenarios: ScenarioService
    documentTitle: DocumentTitleService
    localStorage: LocalStorageService
    userMessages: UserMessageService
    youtube: YoutubeService
    memexExtension: MemexExtensionService
    analytics: AnalyticsService

    // Feature specific services
    activityStreams: ActivityStreamsService
    userManagement: UserManagementService
    webMonetization: WebMonetizationService
    summarization: SummarizationService
}
