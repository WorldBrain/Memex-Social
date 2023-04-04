import createBrowserHistory from 'history/createBrowserHistory'
import * as serviceWorker from './serviceWorker'
import { BackendType } from './types'
import { mainProgram } from './setup/main'
import { metaProgram } from './setup/meta'
import { ProgramQueryParams } from './setup/types'
import { runDevelopmentRpc } from './rpc'
import { parseReaderPath } from './features/reader/utils'
import { readerProgram } from './setup/reader'

export async function setup(options: {
    backend: BackendType
    logLogicEvents?: boolean
    queryParams: ProgramQueryParams
}) {
    const readerPath = parseReaderPath(document.location.pathname)
    const runMetaProgram = options.queryParams.meta === 'true'

    if (readerPath) {
        readerProgram({ ...options, ...readerPath })
    } else if (process.env.NODE_ENV === 'development' && runMetaProgram) {
        if (options.backend !== 'memory') {
            throw new Error(
                `You tried to run the Meta UI without using the 'memory' backend. Killing myself to avert disaster, goodbye!`,
            )
        }

        const history = createBrowserHistory()
        metaProgram({ history, queryParams: options.queryParams })
    } else {
        const setup = await mainProgram(options)
        Object.assign(window, setup)
    }

    serviceWorker.unregister()
}

export async function main(options: {
    backend: BackendType
    logLogicEvents?: boolean
    queryParams: ProgramQueryParams
}) {
    if (
        process.env.NODE_ENV === 'development' &&
        options.queryParams.rpc === 'true'
    ) {
        runDevelopmentRpc()
    } else {
        await setup(options)
    }
}
