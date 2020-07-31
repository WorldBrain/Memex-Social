import { History } from "history";
import createResolvable from '@josephg/resolvable'
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
import { GetCallModifications } from "./scenarios/types";

export function createServices(options: {
    backend: BackendType, storage: Storage,
    history: History, uiMountPoint: Element,
    localStorage: LimitedWebStorage,
    firebase?: typeof firebase
    logLogicEvents?: boolean
}): Services {
    const logicRegistry = new LogicRegistryService({ logEvents: options.logLogicEvents });
    const device = new DeviceService({ rootElement: options.uiMountPoint })

    let auth: AuthService
    if (options.backend === 'firebase' || options.backend === 'firebase-emulator') {
        auth = new FirebaseAuthService(options.firebase ?? firebase, { storage: options.storage })
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

    const callModifier = new CallModifier()
    services.scenarios = services.fixtures
        ? new ScenarioService({
            services: { fixtures: services.fixtures, logicRegistry, auth },
            modifyCalls: getModifications => {
                callModifier.modify({ storage: options.storage, services }, getModifications)
            }
        })
        : undefined

    return services
}

class CallModifier {
    private modifiedCalls: { [name: string]: { undo: () => void } } = {}

    modify(context: { storage: Storage, services: Services }, getModifications: GetCallModifications) {
        const modifications = getModifications(context)
        for (const modification of modifications) {
            if (modification.modifier === 'undo') {
                this.modifiedCalls[modification.name].undo()
                continue
            }

            const { object, property } = modification
            const blockPromise = createResolvable()
            const origCall = object[property]
            if (modification.modifier === 'sabotage') {
                object[property] = async (...args: any[]) => {
                    throw new Error(`Call '${String(property)}' was modified to throw an error`)
                }
            } else if (modification.modifier === 'block') {
                object[property] = async (...args: any[]) => {
                    await blockPromise
                    return origCall.apply(object, args)
                }
            }
            this.modifiedCalls[modification.name] = {
                undo: () => {
                    object[property] = origCall
                    blockPromise.resolve()
                }
            }
        }
    }
}
