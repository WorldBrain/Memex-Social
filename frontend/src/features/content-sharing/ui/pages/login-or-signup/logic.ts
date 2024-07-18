import type { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'
import {
    UILogic,
    UIEventHandler,
    loadInitial,
} from '../../../../../main-ui/classes/logic'
import type {
    LoginOrSignupPageDependencies,
    LoginOrSignupPageEvent,
} from './types'
import {
    getExtensionID,
    sendMessageToExtension,
} from '../../../../../services/auth/auth-sync'
import { ExtMessage } from '@worldbrain/memex-common/lib/authentication/auth-sync'
import { isMemexInstalled } from '../../../../../utils/memex-installed'

export interface LoginOrSignupPageState {
    signupLoadState: UITaskState
    loadState: UITaskState
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
            signupLoadState: 'pristine',
            loadState: 'pristine',
        }
    }

    init: EventHandler<'init'> = async () => {
        await loadInitial(this, async () => {
            let memexInstalled = isMemexInstalled()
            let authEnforced = await this.dependencies.services.auth.enforceAuth(
                {
                    reason: 'registration-requested',
                },
            )
            if (!authEnforced.successful) {
                authEnforced = await this.dependencies.services.auth.enforceAuth(
                    {
                        reason: 'registration-requested',
                    },
                )
            }
            if (memexInstalled) {
                await this.dependencies.services.auth.waitForAuthSync()
            }

            if (authEnforced.type === 'registered-and-authenticated') {
                window.open(
                    'https://links.memex.garden/onboarding/new-user',
                    '_self',
                )
            } else {
                this.emitMutation({ signupLoadState: { $set: 'success' } })
            }
            this.emitMutation({ signupLoadState: { $set: 'success' } })
        })
    }
}
