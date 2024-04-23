import type { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'
import {
    UILogic,
    UIEventHandler,
    executeUITask,
    loadInitial,
} from '../../../../../main-ui/classes/logic'
import type {
    LoginOrSignupPageDependencies,
    LoginOrSignupPageEvent,
} from './types'
import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'
import { CLOUDFLARE_WORKER_URLS } from '@worldbrain/memex-common/lib/content-sharing/storage/constants'
import { RETRIEVE_PDF_ROUTE } from '@worldbrain/memex-common/lib/pdf/uploads/constants'
import * as PDFJS from 'pdfjs-dist'
import type { TypedArray } from 'pdfjs-dist/types/display/api'
import { extractDataFromPDFDocument } from '@worldbrain/memex-common/lib/page-indexing/content-extraction/extract-pdf-content'
import { determineEnv } from '../../../../../utils/runtime-environment'
import {
    getExtensionID,
    sendMessageToExtension,
} from '../../../../../services/auth/auth-sync'
import { ExtMessage } from '@worldbrain/memex-common/lib/authentication/auth-sync'

export interface LoginOrSignupPageState {
    signUpSuccessful: boolean
    loadState: UITaskState
    linkCreationState: UITaskState
}

type EventHandler<
    EventName extends keyof LoginOrSignupPageEvent
> = UIEventHandler<LoginOrSignupPageState, LoginOrSignupPageEvent, EventName>

export default class LoginOrSignupPageLogic extends UILogic<
    LoginOrSignupPageState,
    LoginOrSignupPageEvent
> {
    private static EXPECTED_ORIGIN = 'https://memex.garden'

    constructor(
        private dependencies: LoginOrSignupPageDependencies & {
            windowObj: Pick<
                Window,
                'addEventListener' | 'removeEventListener' | 'opener'
            >
        },
    ) {
        super()
    }

    getInitialState(): LoginOrSignupPageState {
        return {
            signUpSuccessful: false,
            loadState: 'pristine',
            linkCreationState: 'pristine',
        }
    }

    init: EventHandler<'init'> = async () => {
        await loadInitial(this, async () => {
            await this.dependencies.services.auth.enforceAuth({
                reason: 'registration-requested',
            })
            await this.dependencies.services.auth.waitForAuth()
            this.emitMutation({ signUpSuccessful: { $set: true } })
            await this.dependencies.services.auth.waitForAuthSync()
            let extensionID = getExtensionID()
            const message = ExtMessage.TRIGGER_ONBOARDING
            await sendMessageToExtension(message, extensionID, undefined)
        })
    }
}
