import createBrowserHistory from "history/createBrowserHistory";
import debounce from 'lodash/debounce'
import * as firebase from 'firebase';
import runMainUi, { getUiMountpoint } from '../main-ui'
import { createServices } from '../services';
import { MainProgramOptions, MainProgramSetup } from './types';
import { createStorage } from '../storage';
import { getReplayOptionsFromQueryParams } from '../services/scenarios';
import { MemoryLocalStorage } from "../utils/web-storage";

export async function mainProgram(options: MainProgramOptions): Promise<MainProgramSetup> {
    if (options.backend === 'firebase') {
        firebase.initializeApp({
            // TODO: fill out
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
