import debounce from 'lodash/debounce'
import createBrowserHistory from 'history/createBrowserHistory'
import firebase from 'firebase/compat'
import { createStorage } from '../storage'
import { createServices } from '../services'
import { MainProgramOptions } from './types'
import { getUiMountpoint } from '../main-ui'
import { StorageHooksChangeWatcher } from '@worldbrain/memex-common/lib/storage/hooks'
import { MemoryLocalStorage } from '../utils/web-storage'
import { createYoutubeServiceOptions } from '@worldbrain/memex-common/lib/services/youtube/library'
import { runReaderUi } from '../features/reader/ui/main'

export async function readerProgram(
    options: MainProgramOptions & {
        collectionId: string
        entryId: string
    },
) {
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

    const uiMountPoint = getUiMountpoint(options.mountPoint)
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

    if (storageHooksChangeWatcher) {
        storageHooksChangeWatcher.setUp({
            fetch,
            services,
            getFunctionsConfig: () => ({
                twitter: { api_key: 'test', api_key_secret: 'test' },
                content_sharing: { cloudflare_worker_credentials: 'test' },
            }),
            captureException: async (error) => undefined, // TODO: maybe implement this
            serverStorageManager: storage.serverStorageManager,
            getCurrentUserReference: async () =>
                services.auth.getCurrentUserReference(),
        })
    }

    runReaderUi({ storage, services, uiMountPoint })
}
