import { AuthService } from './auth/types'
import OverlayService from './overlay'
import LogicRegistryService from './logic-registry'
import FixtureService from './fixtures'
import RouterService from './router'
import { ScenarioService } from './scenarios'
import { DeviceService } from './device'
import { DocumentTitleService } from './document-title'
import ContentConversationsService from '../features/content-conversations/services/content-conversations'
import { ActivityStreamsService } from '@worldbrain/memex-common/lib/activity-streams/types'
import UserManagementService from '../features/user-management/service'
import WebMonetizationService from '../features/web-monetization/service'

export interface Services {
    router: RouterService
    auth: AuthService
    overlay: OverlayService
    logicRegistry: LogicRegistryService
    device: DeviceService
    fixtures: FixtureService
    scenarios: ScenarioService
    documentTitle: DocumentTitleService
    activityStreams: ActivityStreamsService
    userManagement: UserManagementService

    // Feature specific services
    contentConversations: ContentConversationsService
    webMonetization: WebMonetizationService
}
