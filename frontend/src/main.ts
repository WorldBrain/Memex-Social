console.log('test')
import createBrowserHistory from 'history/createBrowserHistory'
import * as serviceWorker from './serviceWorker'
import { BackendType } from './types'
import { mainProgram } from './setup/main'
import { metaProgram } from './setup/meta'
import { ProgramQueryParams } from './setup/types'
import { runDevelopmentRpc } from './rpc'
import { CloudflareImageSupportBackend } from '@worldbrain/memex-common/lib/image-support/backend'
console.log('test2')

export async function setup(options: {
    backend: BackendType
    logLogicEvents?: boolean
    queryParams: ProgramQueryParams
}) {
    console.log('test3')
    const runMetaProgram = options.queryParams.meta === 'true'

    const imageSupport = new CloudflareImageSupportBackend({
        env: process.env.NODE_ENV == 'production' ? 'production' : 'staging',
    })

    console.log('test5')
    if (process.env.NODE_ENV === 'development' && runMetaProgram) {
        if (options.backend !== 'memory') {
            throw new Error(
                `You tried to run the Meta UI without using the 'memory' backend. Killing myself to avert disaster, goodbye!`,
            )
        }

        const history = createBrowserHistory()
        metaProgram({
            history,
            queryParams: options.queryParams,
            imageSupport: options.imageSupport,
        })
    } else {
        const setup = await mainProgram(options)
        Object.assign(window, setup)
    }
    console.log('test4')

    // serviceWorker.unregister()
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
