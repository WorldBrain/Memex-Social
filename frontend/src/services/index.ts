import { History } from "history";
import * as firebase from 'firebase';
import { Services } from "./types";
import { BackendType } from "../types";
import { Storage } from "../storage/types";
import ROUTES from "../routes";
import OverlayService from "./overlay";
import LogicRegistryService from "./logic-registry";
import FixtureService, { FixtureFetcher, defaultFixtureFetcher } from "./fixtures";
import RouterService from "./router";
import { AuthService } from "./auth/types";
import FirebaseAuthService from "./auth/firebase";
import MemoryAuthService from "./auth/memory";
import { ScenarioService } from "./scenarios";
import { DeviceService } from "./device";
import { LimitedWebStorage } from "../utils/web-storage/types";
import CallModifier from "../utils/call-modifier";
import { DocumentTitleService } from "./document-title";
import ContentConversationsService from "../features/content-conversations/services/content-conversations";
import FirebaseFunctionsActivityStreamsService from "@worldbrain/memex-common/lib/activity-streams/firebase-functions/client";
import MemoryStreamsService from "@worldbrain/memex-common/lib/activity-streams/memory";

export function createServices(options: {
    backend: BackendType, storage: Storage,
    history: History,
    localStorage: LimitedWebStorage,
    uiMountPoint?: Element,
    firebase?: typeof firebase
    logLogicEvents?: boolean
    fixtureFetcher?: FixtureFetcher
}): Services {
    const logicRegistry = new LogicRegistryService({ logEvents: options.logLogicEvents });
    const device = new DeviceService({ rootElement: options.uiMountPoint ?? { clientWidth: 600, clientHeight: 800 } })

    let auth: AuthService
    if (options.backend === 'firebase' || options.backend === 'firebase-emulator') {
        auth = new FirebaseAuthService(options.firebase ?? firebase, { storage: options.storage })
        if (process.env.NODE_ENV === 'development') {
            if (process.env.REACT_APP_USE_FUNCTIONS_EMULATOR === 'true') {
                console.log('Using *emulated* Firebase Functions')
                firebase.functions().useFunctionsEmulator("http://localhost:5001")
            } else {
                console.log('Using *real* Firebase Functions')
            }
        }
    } else if (options.backend === 'memory') {
        auth = new MemoryAuthService({ storage: options.storage })
    } else {
        throw new Error(`Tried to create services with unknown backend: '${options.backend}'`)
    }
    const router = new RouterService({ routes: ROUTES, auth, history: options.history })

    const callModifier = new CallModifier()
    const fixtures = new FixtureService({ storage: options.storage, fixtureFetcher: options.fixtureFetcher ?? defaultFixtureFetcher });
    const activityStreams = options.backend === 'memory' ? new MemoryStreamsService({
        storage: options.storage.serverModules,
        getCurrentUserId: async () => services.auth.getCurrentUserReference()?.id
    }) : new FirebaseFunctionsActivityStreamsService({
        executeCall: async (name, params) => {
            const functions = (options.firebase ?? firebase)!.functions()
            const result = await functions.httpsCallable(name)(params)
            return result.data
        }
    })
    const services: Services = {
        overlay: new OverlayService(),
        logicRegistry,
        device,
        auth,
        router,
        fixtures,
        scenarios: new ScenarioService({
            services: { fixtures: fixtures, logicRegistry, auth },
            modifyCalls: getModifications => {
                callModifier.modify({ storage: options.storage, services }, getModifications)
            },
            executeWithContext: async (f) => {
                return f({ storage: options.storage, services })
            }
        }),
        documentTitle: new DocumentTitleService({
            set: title => { document.title = title },
            get: () => document.title,
        }),
        activityStreams,
        contentConversations: new ContentConversationsService({
            storage: options.storage.serverModules.contentConversations,
            services: { activityStreams },
            auth,
        })
    }

    return services
}

