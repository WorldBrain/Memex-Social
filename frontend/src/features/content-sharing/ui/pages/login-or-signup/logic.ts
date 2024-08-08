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
            } else {
                let user = null

                for (let i = 0; i < 10; i++) {
                    // 10 iterations
                    user = await this.dependencies.services.auth.getCurrentUser()
                    if (user) break
                    await new Promise((resolve) => setTimeout(resolve, 1000)) // wait 1 second
                }
            }

            if (authEnforced.isNewUser || authEnforced.reactivatedUser) {
                window.open(
                    'https://links.memex.garden/onboarding/new-user',
                    '_blank',
                )
            } else {
                this.emitMutation({ signupLoadState: { $set: 'success' } })
            }
            this.emitMutation({ signupLoadState: { $set: 'success' } })
        })
    }
}
