import { History } from 'history'
import firebaseModule from 'firebase'
import { firebaseService } from '@worldbrain/memex-common/lib/firebase-backend/services/client'
import FirebaseFunctionsActivityStreamsService from '@worldbrain/memex-common/lib/activity-streams/services/firebase-functions/client'
import MemoryStreamsService from '@worldbrain/memex-common/lib/activity-streams/services/memory'
import { MemoryUserMessageService } from '@worldbrain/memex-common/lib/user-messages/service/memory'
import { FirebaseUserMessageService } from '@worldbrain/memex-common/lib/user-messages/service/firebase'
import { BackendType } from '../types'
import { Storage } from '../storage/types'
import ROUTES from '../routes'
import ContentConversationsService from '../features/content-conversations/services/content-conversations'
import { Services } from './types'
import OverlayService from './overlay'
import LogicRegistryService from './logic-registry'
import FixtureService, {
    FixtureFetcher,
    defaultFixtureFetcher,
} from './fixtures'
import RouterService from './router'
import { AuthService } from './auth/types'
import FirebaseAuthService from './auth/firebase'
import MemoryAuthService from './auth/memory'
import { ScenarioService } from './scenarios'
import { DeviceService } from './device'
import { LimitedWebStorage } from '../utils/web-storage/types'
import CallModifier from '../utils/call-modifier'
import { DocumentTitleService } from './document-title'
import UserManagementService from '../features/user-management/service'
import FirebaseWebMonetizationService from '../features/web-monetization/service/firebase'
import { MemoryLocalStorageService } from './local-storage/memory'
import { BrowserLocalStorageService } from './local-storage/browser'
import { ContentSharingService } from '@worldbrain/memex-common/lib/content-sharing/service'
import { ContentSharingServiceInterface } from '@worldbrain/memex-common/lib/content-sharing/service/types'

export function createServices(options: {
    backend: BackendType
    storage: Storage
    history: History
    localStorage: LimitedWebStorage
    uiMountPoint?: Element
    firebase?: typeof firebaseModule
    logLogicEvents?: boolean
    fixtureFetcher?: FixtureFetcher
}): Services {
    const firebase = options.firebase ?? firebaseModule
    const logicRegistry = new LogicRegistryService({
        logEvents: options.logLogicEvents,
    })
    const device = new DeviceService({
        rootElement: options.uiMountPoint ?? {
            clientWidth: 600,
            clientHeight: 800,
        },
    })

    let auth: AuthService
    if (
        options.backend === 'firebase' ||
        options.backend === 'firebase-emulator'
    ) {
        auth = new FirebaseAuthService(firebase, { storage: options.storage })
        if (process.env.NODE_ENV === 'development') {
            if (options.backend === 'firebase-emulator') {
                firebase.database().useEmulator('localhost', 9000)
                firebase.firestore().useEmulator('localhost', 8080)
                firebase.auth().useEmulator('http://localhost:9099/')
            }
            if (
                options.backend === 'firebase-emulator' ||
                process.env.REACT_APP_USE_FUNCTIONS_EMULATOR === 'true'
            ) {
                console.log('Using *emulated* Firebase Functions')
                firebaseModule
                    .functions()
                    .useFunctionsEmulator('http://localhost:5001')
            } else {
                console.log('Using *real* Firebase Functions')
            }
        }
    } else if (options.backend === 'memory') {
        auth = new MemoryAuthService({ storage: options.storage })
    } else {
        throw new Error(
            `Tried to create services with unknown backend: '${options.backend}'`,
        )
    }
    const router = new RouterService({
        routes: ROUTES,
        auth,
        history: options.history,
        setBeforeLeaveHandler: (handler) => {
            window.onbeforeunload = handler
        },
    })

    const callModifier = new CallModifier()
    const fixtures = new FixtureService({
        storage: options.storage,
        fixtureFetcher: options.fixtureFetcher ?? defaultFixtureFetcher,
    })
    const executeFirebaseCall: (
        name: string,
        params: any,
    ) => Promise<any> = async (name, params) => {
        const functions = firebase.functions()
        const result = await functions.httpsCallable(name)(params)
        return result.data
    }
    const activityStreams =
        options.backend === 'memory'
            ? new MemoryStreamsService({
                  storage: options.storage.serverModules,
                  getCurrentUserId: async () =>
                      services.auth.getCurrentUserReference()?.id,
              })
            : new FirebaseFunctionsActivityStreamsService({
                  executeCall: executeFirebaseCall,
              })
    const userManagement = new UserManagementService({
        storage: options.storage.serverModules.users,
        auth,
    })
    // const webMonetization = options.backend === 'memory' ? new MemoryWebMonetizationService({
    //     services: { userManagement, auth }
    // }) : new FirebaseWebMonetizationService({
    //     services: { userManagement, auth }
    // })
    const webMonetization = new FirebaseWebMonetizationService({
        services: { userManagement, auth },
    })
    const localStorage =
        options.backend === 'memory'
            ? new MemoryLocalStorageService()
            : new BrowserLocalStorageService(options.localStorage)
    const userMessages =
        options.backend === 'memory'
            ? new MemoryUserMessageService()
            : new FirebaseUserMessageService({
                  firebase: firebase as any,
                  auth: {
                      getCurrentUserId: async () =>
                          services.auth.getCurrentUserReference()?.id ?? null,
                  },
              })
    const contentSharing =
        options.backend === 'memory'
            ? new ContentSharingService({
                  contentSharing: options.storage.serverModules.contentSharing,
                  userMessages,
                  getCurrentUserId: async () =>
                      auth.getCurrentUserReference()?.id ?? null,
              })
            : firebaseService<ContentSharingServiceInterface>(
                  executeFirebaseCall,
              )

    const services: Services = {
        overlay: new OverlayService(),
        logicRegistry,
        device,
        auth,
        router,
        fixtures,
        localStorage,
        userMessages,
        scenarios: new ScenarioService({
            services: { fixtures: fixtures, logicRegistry, auth },
            modifyCalls: (getModifications) => {
                callModifier.modify(
                    { storage: options.storage, services },
                    getModifications,
                )
            },
            executeWithContext: async (f) => {
                return f({ storage: options.storage, services })
            },
        }),
        documentTitle: new DocumentTitleService({
            set: (title) => {
                document.title = title
            },
            get: () => document.title,
        }),
        activityStreams,
        userManagement,
        contentSharing: contentSharing,
        contentConversations: new ContentConversationsService({
            storage: options.storage.serverModules.contentConversations,
            services: { activityStreams, router },
            auth,
        }),
        webMonetization,
    }

    return services
}
