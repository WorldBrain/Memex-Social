import { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import { UnseenActivityTracker } from '@worldbrain/memex-common/lib/activity-streams/utils'
import {
    UILogic,
    UIEventHandler,
    loadInitial,
} from '../../../../../main-ui/classes/logic'
import {
    UnseenActivityIndicatorEvent,
    UnseenActivityIndicatorDependencies,
    UnseenActivityIndicatorState,
} from './types'

type EventHandler<
    EventName extends keyof UnseenActivityIndicatorEvent
> = UIEventHandler<
    UnseenActivityIndicatorState,
    UnseenActivityIndicatorEvent,
    EventName
>

export default class UnseenActivityIndicatorLogic extends UILogic<
    UnseenActivityIndicatorState,
    UnseenActivityIndicatorEvent
> {
    tracker: UnseenActivityTracker

    constructor(private dependencies: UnseenActivityIndicatorDependencies) {
        super()

        this.tracker = new UnseenActivityTracker({
            getLatestActivityTimestamp: () =>
                this.dependencies.services.activityStreams
                    .getHomeFeedInfo()
                    .then((info) => info.latestActivityTimestamp),
            getHomeFeedTimestamp: (user: UserReference) =>
                this.dependencies.storage.activityStreams
                    .retrieveHomeFeedTimestamp({
                        user: user,
                    })
                    .then((result) => result?.timestamp ?? null),
        })

        this.subscribeToServiceEvent(
            this.dependencies.services.auth,
            'changed',
            () => {
                this._update()
            },
        )
    }

    getInitialState(): UnseenActivityIndicatorState {
        return {
            loadState: 'pristine',
        }
    }

    init: EventHandler<'init'> = async () => {
        await loadInitial<UnseenActivityIndicatorState>(this, async () => {
            await this._update()
        })
    }

    async _update() {
        const user = this.dependencies.services.auth.getCurrentUserReference()
        if (!this.tracker.needsUpdate(user)) {
            return
        }

        this.emitMutation({
            isAuthenticated: { $set: !!user },
            $unset: ['hasUnseen'],
        })

        const { hasUnseen } = await this.tracker.update(user)
        this.emitMutation({
            hasUnseen: { $set: hasUnseen },
        })
    }
}
