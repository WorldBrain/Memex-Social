import { createBrowserHistory } from 'history'
import debounce from 'lodash/debounce'
import firebase from 'firebase/compat/app'
import 'firebase/compat/auth'
import 'firebase/compat/database'
import 'firebase/compat/functions'
import 'firebase/compat/firestore'
import { getUiMountpoint, getDefaultUiRunner } from '../main-ui'
import { createServices } from '../services'
import { MainProgramOptions, MainProgramSetup } from './types'
import { createStorage } from '../storage'
import { getReplayOptionsFromQueryParams } from '../services/scenarios'
import { MemoryLocalStorage } from '../utils/web-storage'
import { RouteName } from '../routes'
import { createYoutubeServiceOptions } from '@worldbrain/memex-common/lib/services/youtube/library'
import type { GenerateServerID } from '@worldbrain/memex-common/lib/content-sharing/service/types'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'
import { LLMEndpointsService } from '@worldbrain/memex-common/lib/llm-endpoints'

export async function mainProgram(
    options: MainProgramOptions,
): Promise<MainProgramSetup> {
    if (
        options.backend === 'firebase' ||
        options.backend === 'firebase-emulator'
    ) {
        firebase.initializeApp({
            apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
            authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
            databaseURL: process.env.REACT_APP_FIREBASE_DATABSE_URL,
            projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
            messagingSenderId:
                process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.REACT_APP_FIREBASE_APP_ID,
            measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
        })
    }

    const history = options.history || createBrowserHistory()

    const uiMountPoint = !options.domUnavailable
        ? getUiMountpoint(options.mountPoint)
        : undefined

    let storageHooksChangeWatcher: any
    if (options.backend === 'memory') {
        const {
            StorageHooksChangeWatcher,
        } = require('@worldbrain/memex-common/lib/storage/hooks')
        storageHooksChangeWatcher = new StorageHooksChangeWatcher()
    }

    const generateServerId: GenerateServerID = (collectionName) =>
        firebase.firestore().collection(collectionName).doc().id

    const storage = await createStorage({
        ...options,
        changeWatcher: storageHooksChangeWatcher,
    })

    const aiChat = new LLMEndpointsService()

    const services = createServices({
        ...options,
        fetch,
        aiChat,
        firebase,
        queryParams: options.queryParams,
        history,
        storage,
        uiMountPoint,
        generateServerId,
        fixtureFetcher: options.fixtureFetcher,
        clipboard: options.clipboard ?? navigator.clipboard,
        fetchPDFData:
            options.backend === 'memory'
                ? require('@worldbrain/memex-common/lib/page-indexing/fetch-page-data/fetch-pdf-data.node')
                : undefined,
        localStorage:
            options.backend.indexOf('memory') === 0
                ? new MemoryLocalStorage()
                : localStorage,
        youtubeOptions: options.youtubeOptions ?? createYoutubeServiceOptions(),
    })

    if (!options.domUnavailable) {
        window.addEventListener(
            'resize',
            debounce(() => {
                services.device.processRootResize()
            }, 200),
        )
    }

    const scenarioIdentifier =
        services.scenarios && options.queryParams.scenario
    if (scenarioIdentifier) {
        await services.scenarios.loadScenarioFixture(scenarioIdentifier)
    }
    if (storageHooksChangeWatcher) {
        storageHooksChangeWatcher.setUp({
            fetch,
            services,
            normalizeUrl,
            getFunctionsConfig: () => ({
                twitter: { api_key: 'test', api_key_secret: 'test' },
                content_sharing: { cloudflare_worker_credentials: 'test' },
            }),
            captureException: async () => undefined, // TODO: maybe implement this
            serverStorageManager: storage.serverStorageManager,
            getCurrentUserReference: async () =>
                services.auth.getCurrentUserReference(),
        })
    }
    if (options.queryParams.scenario && options.navigateToScenarioStart) {
        const scenario = services.scenarios.findScenario(
            options.queryParams.scenario,
        )
        let startUrlPath = services.router.getUrl(
            scenario.startRoute.route as RouteName,
            scenario.startRoute.params,
        )
        if (scenario.startRoute.query) {
            startUrlPath += '?'
            startUrlPath += Object.entries(scenario.startRoute.query)
                .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
                .join('&')
        }
        history.replace(startUrlPath)
    }
    if (scenarioIdentifier) {
        await services.scenarios.startScenarioReplay(
            scenarioIdentifier,
            getReplayOptionsFromQueryParams(options.queryParams),
        )
    }

    const uiRunner = uiMountPoint
        ? getDefaultUiRunner({ mountPoint: uiMountPoint })
        : options.uiRunner
    if (!uiRunner) {
        throw new Error(
            `Detected DOM is unavailable, but no UI runner was given`,
        )
    }

    let uiRunning = false
    const runUi = async () => {
        if (uiRunning) {
            return
        }
        uiRunning = true
        return uiRunner({
            services,
            storage,
            history,
            generateServerId,
            imageSupport: options.imageSupport,
            getRootElement: () => {
                if (!uiMountPoint) {
                    throw new Error(
                        `Tried to get root element, but no UI mount point was given`,
                    )
                }
                return uiMountPoint as HTMLElement
            },
        })
    }
    if (!options.dontRunUi) {
        await runUi()
    }
    return {
        storage,
        services,
        stepWalkthrough:
            services.scenarios &&
            (async () => {
                await services.scenarios?.stepWalkthrough?.()
            }),
        runUi,
        imageSupport: options.imageSupport,
    }
}
