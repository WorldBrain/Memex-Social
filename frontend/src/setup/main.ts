import createBrowserHistory from "history/createBrowserHistory";
import debounce from 'lodash/debounce'
import * as firebase from 'firebase';
import runMainUi, { getUiMountpoint } from '../main-ui'
import { createServices } from '../services';
import { MainProgramOptions, MainProgramSetup } from './types';
import { createStorage } from '../storage';
import { getReplayOptionsFromQueryParams } from '../services/scenarios';
import { MemoryLocalStorage } from "../utils/web-storage";
import { RouteName } from "../routes";

export async function mainProgram(options: MainProgramOptions): Promise<MainProgramSetup> {
    if (options.backend === 'firebase' || options.backend === 'firebase-emulator') {
        firebase.initializeApp({
            apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
            authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
            databaseURL: process.env.REACT_APP_FIREBASE_DATABSE_URL,
            projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
            messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.REACT_APP_FIREBASE_APP_ID,
            measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
        })
    }

    const history = options.history || createBrowserHistory()

    const uiMountPoint = getUiMountpoint(options.mountPoint)
    const storage = await createStorage(options)
    const services = createServices({
        ...options,
        history,
        storage,
        uiMountPoint,
        localStorage: options.backend.indexOf('memory') === 0 ? new MemoryLocalStorage() : localStorage
    })

    window.addEventListener('resize', debounce(() => {
        services.device.processRootResize()
    }, 200))

    if (services.scenarios && options.queryParams.scenario && options.navigateToScenarioStart) {
        const scenario = services.scenarios.findScenario(options.queryParams.scenario)
        const startUrlPath = services.router.getUrl(scenario.startRoute.route as RouteName, scenario.startRoute.params)
        history.replace(startUrlPath)
    }
    if (services.scenarios && options.queryParams.scenario) {
        await services.scenarios.startScenarioReplay(options.queryParams.scenario, getReplayOptionsFromQueryParams(options.queryParams))
    }

    await runMainUi({ services, storage, history, mountPoint: uiMountPoint })
    return {
        storage, services, stepWalkthrough: services.scenarios && (() => {
            services.scenarios && services.scenarios.stepWalkthrough()
        })
    }
}
