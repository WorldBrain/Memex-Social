import createBrowserHistory from 'history/createBrowserHistory'
import debounce from 'lodash/debounce'
import firebase from 'firebase'
import { StorageHooksChangeWatcher } from '@worldbrain/memex-common/lib/storage/hooks'
import { getUiMountpoint, getDefaultUiRunner } from '../main-ui'
import { createServices } from '../services'
import { MainProgramOptions, MainProgramSetup } from './types'
import { createStorage } from '../storage'
import { getReplayOptionsFromQueryParams } from '../services/scenarios'
import { MemoryLocalStorage } from '../utils/web-storage'
import { RouteName } from '../routes'

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
    const storageHooksChangeWatcher =
        options.backend === 'memory'
            ? new StorageHooksChangeWatcher()
            : undefined

    const storage = await createStorage({
        ...options,
        changeWatcher: storageHooksChangeWatcher,
    })
    const services = createServices({
        ...options,
        queryParams: options.queryParams,
        history,
        storage,
        uiMountPoint,
        fixtureFetcher: options.fixtureFetcher,
        clipboard: options.clipboard ?? navigator.clipboard,
        localStorage:
            options.backend.indexOf('memory') === 0
                ? new MemoryLocalStorage()
                : localStorage,
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
            services,
            serverStorageManager: storage.serverStorageManager,
            getCurrentUserReference: async () =>
                services.auth.getCurrentUserReference(),
        })
    }
    if (options.queryParams.scenario && options.navigateToScenarioStart) {
        const scenario = services.scenarios.findScenario(
            options.queryParams.scenario,
        )
        const startUrlPath = services.router.getUrl(
            scenario.startRoute.route as RouteName,
            scenario.startRoute.params,
        )
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
        return uiRunner({ services, storage, history })
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
    }
}
