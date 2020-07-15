import { History } from "history";
import * as firebase from 'firebase';
import { Services } from "./types";
import { BackendType } from "../types";
import { Storage } from "../storage/types";
import ROUTES from "../routes";
import OverlayService from "./overlay";
import LogicRegistryService from "./logic-registry";
import FixtureService, { defaultFixtureFetcher } from "./fixtures";
import RouterService from "./router";
import { AuthService } from "./auth/types";
import FirebaseAuthService from "./auth/firebase";
import MemoryAuthService from "./auth/memory";
import { ScenarioService } from "./scenarios";
import { DeviceService } from "./device";
import { LimitedWebStorage } from "../utils/web-storage/types";

export function createServices(options: {
    backend: BackendType, storage: Storage,
    history: History, uiMountPoint: Element,
    localStorage: LimitedWebStorage,
    authService?: AuthService
    logLogicEvents?: boolean
}): Services {
    const logicRegistry = new LogicRegistryService({ logEvents: options.logLogicEvents });
    const device = new DeviceService({ rootElement: options.uiMountPoint })

    let auth: AuthService
    if (options.authService) {
        auth = options.authService
    } else if (options.backend === 'firebase' || options.backend === 'firebase-emulator') {
        auth = new FirebaseAuthService(firebase, { storage: options.storage })
    } else if (options.backend === 'memory') {
        auth = new MemoryAuthService({ storage: options.storage })
    } else {
        throw new Error(`Tried to create services with unknown backend: '${options.backend}'`)
    }
    const router = new RouterService({ routes: ROUTES, auth, history: options.history })

    const services: Services = {
        overlay: new OverlayService(),
        logicRegistry,
        device,
        auth,
        router,
    }

    services.fixtures = process.env.NODE_ENV === 'development'
        ? new FixtureService({ storage: options.storage, fixtureFetcher: defaultFixtureFetcher })
        : undefined
    services.scenarios = services.fixtures
        ? new ScenarioService({ services: { fixtures: services.fixtures, logicRegistry, auth } })
        : undefined

    return services
}
