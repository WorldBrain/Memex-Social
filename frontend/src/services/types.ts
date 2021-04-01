import type { Services as SharedServices } from '@worldbrain/memex-common/lib/services/types'
import { AuthService } from './auth/types'
import FixtureService from './fixtures'
import RouterService from './router'
import { ScenarioService } from './scenarios'
import { DocumentTitleService } from './document-title'
import ContentConversationsService from '../features/content-conversations/services/content-conversations'
import { ActivityStreamsService } from '@worldbrain/memex-common/lib/activity-streams/types'
import { UserMessageService } from '@worldbrain/memex-common/lib/user-messages/service/types'
import UserManagementService from '../features/user-management/service'
import WebMonetizationService from '../features/web-monetization/service'
import { LocalStorageService } from './local-storage/types'

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

    // Feature specific services
    contentConversations: ContentConversationsService
    activityStreams: ActivityStreamsService
    userManagement: UserManagementService
    webMonetization: WebMonetizationService
}
