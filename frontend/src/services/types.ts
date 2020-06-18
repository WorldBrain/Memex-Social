import { AuthService } from "./auth/types"
import OverlayService from "./overlay"
import LogicRegistryService from "./logic-registry"
import FixtureService from "./fixtures"
import RouterService from "./router"
import StyleRegistryService from "./style-registry"
import { ScenarioService } from "./scenarios"
import { DeviceService } from "./device"

export interface Services {
    router: RouterService
    auth: AuthService
    overlay: OverlayService
    logicRegistry: LogicRegistryService
    styleRegistry: StyleRegistryService
    device: DeviceService

    // only available when playground enabled
    fixtures?: FixtureService
    scenarios?: ScenarioService
}
