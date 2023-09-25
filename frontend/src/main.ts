import createBrowserHistory from 'history/createBrowserHistory'
import { CloudflareImageSupportBackend } from '@worldbrain/memex-common/lib/image-support/backend'
import { ImageSupportInterface } from '@worldbrain/memex-common/lib/image-support/types'
import { BackendType } from './types'
import { mainProgram } from './setup/main'
import { metaProgram } from './setup/meta'
import { ProgramQueryParams } from './setup/types'
import { runDevelopmentRpc } from './rpc'

export async function setup(options: {
    backend: BackendType
    logLogicEvents?: boolean
    queryParams: ProgramQueryParams
}) {
    const runMetaProgram = options.queryParams.meta === 'true'

    const imageSupportBackend = new CloudflareImageSupportBackend({
        env: process.env.NODE_ENV == 'production' ? 'production' : 'staging',
    })
    const imageSupport: ImageSupportInterface = {
        generateImageId: async () => '', // replaced later in services setup
        uploadImage: (params) => {
            if (typeof params.image === 'string') {
                throw new Error(`You can only upload blobs, not data URIs`)
            }
            return imageSupportBackend.uploadImage({
                ...params,
                image: params.image,
            })
        },
        getImageUrl: (params) => imageSupportBackend.getImageUrl(params),
    }

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
            imageSupport,
        })
    } else {
        const setup = await mainProgram({ ...options, imageSupport })
        Object.assign(window, setup)
    }

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
