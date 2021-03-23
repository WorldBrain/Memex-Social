import { AuthService } from './auth/types'
import ClipboardService from './clipboard'
import LogicRegistryService from './logic-registry'
import FixtureService from './fixtures'
import RouterService from './router'
import { ScenarioService } from './scenarios'
import { DeviceService } from './device'
import { DocumentTitleService } from './document-title'
import ContentConversationsService from '../features/content-conversations/services/content-conversations'
import { ActivityStreamsService } from '@worldbrain/memex-common/lib/activity-streams/types'
import { UserMessageService } from '@worldbrain/memex-common/lib/user-messages/service/types'
import UserManagementService from '../features/user-management/service'
import WebMonetizationService from '../features/web-monetization/service'
import { LocalStorageService } from './local-storage/types'
import { ContentSharingService } from '../features/content-sharing/service'
import type { OverlayServiceInterface } from './overlay/types'

export interface Services {
    router: RouterService
    auth: AuthService
    overlay: OverlayServiceInterface
    clipboard: ClipboardService
    logicRegistry: LogicRegistryService
    device: DeviceService
    fixtures: FixtureService
    scenarios: ScenarioService
    documentTitle: DocumentTitleService
    localStorage: LocalStorageService
    userMessages: UserMessageService

    // Feature specific services
    contentSharing: ContentSharingService
    contentConversations: ContentConversationsService
    activityStreams: ActivityStreamsService
    userManagement: UserManagementService
    webMonetization: WebMonetizationService
}
