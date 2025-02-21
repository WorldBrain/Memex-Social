import type { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'
import {
    UILogic,
    UIEventHandler,
    loadInitial,
} from '../../../../../main-ui/classes/logic'
import type {
    OauthCallBackPageDependencies,
    OauthCallBackPageEvent,
} from './types'
import {
    getExtensionID,
    sendMessageToExtension,
} from '../../../../../services/auth/auth-sync'
import { ExtMessage } from '@worldbrain/memex-common/lib/authentication/auth-sync'
import { sleepPromise } from '../../../../../utils/promises'

export interface OauthCallBackPageState {
    signupLoadState: UITaskState
    loadState: UITaskState
}

type EventHandler<
    EventName extends keyof OauthCallBackPageEvent
> = UIEventHandler<OauthCallBackPageState, OauthCallBackPageEvent, EventName>

export default class OauthCallBackPageLogic extends UILogic<
    OauthCallBackPageState,
    OauthCallBackPageEvent
> {
    private static EXPECTED_ORIGIN =
        process.env.NODE_ENV === 'production'
            ? 'https://memex.garden'
            : 'https://staging.memex.garden'

    constructor(
        private dependencies: OauthCallBackPageDependencies & {
            windowObj: Pick<
                Window,
                'addEventListener' | 'removeEventListener' | 'opener'
            >
        },
    ) {
        super()
    }

    getInitialState(): OauthCallBackPageState {
        return {
            signupLoadState: 'pristine',
            loadState: 'pristine',
        }
    }

    init: EventHandler<'init'> = async () => {
        let token = window.location.hash.replace('#', '')
        if (!token) {
            throw new Error('No access token found in URL fragment')
        }

        const channel = new BroadcastChannel('bluesky-auth')
        channel.postMessage(token)

        await sleepPromise(100)
        channel.close()
        window.close()
    }
}
