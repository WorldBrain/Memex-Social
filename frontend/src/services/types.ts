import { AuthService } from "./auth/types"
import OverlayService from "./overlay"
import LogicRegistryService from "./logic-registry"
import FixtureService from "./fixtures"
import RouterService from "./router"
import { ScenarioService } from "./scenarios"
import { DeviceService } from "./device"
import { DocumentTitleService } from "./document-title"
import ContentConversationsService from "../features/content-conversations/services/content-conversations"

export interface Services {
    router: RouterService
    auth: AuthService
    overlay: OverlayService
    logicRegistry: LogicRegistryService
    device: DeviceService
    fixtures: FixtureService
    scenarios: ScenarioService
    documentTitle: DocumentTitleService
    contentConversations: ContentConversationsService
}
