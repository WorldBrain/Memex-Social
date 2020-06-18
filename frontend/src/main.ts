import createBrowserHistory from "history/createBrowserHistory";
import * as serviceWorker from './serviceWorker'
import { BackendType } from './types';
import { mainProgram } from "./setup/main";
import { metaProgram } from "./setup/meta";
import { ProgramQueryParams } from "./setup/types";
import { runDevelopmentRpc } from "./rpc";

export async function setup(options : { backend : BackendType, logLogicEvents? : boolean, queryParams: ProgramQueryParams }) {
    const runMetaProgram = options.queryParams.meta === 'true'
    if (!(process.env.NODE_ENV === 'development' && runMetaProgram)) {
        const setup = await mainProgram(options)
        Object.assign(window, setup)
    } else {
        const history = createBrowserHistory()
        metaProgram({ history, queryParams: options.queryParams })
    }

    serviceWorker.unregister()
}

export async function main(options : { backend : BackendType, logLogicEvents? : boolean, queryParams: ProgramQueryParams }) {
    if (process.env.NODE_ENV === 'development' && options.queryParams.rpc === 'true') {
        runDevelopmentRpc()
    } else {
        await setup(options)
    }
}
