import createResolvable, { Resolvable } from '@josephg/resolvable'
import { UILogic, UIEventHandler, loadInitial } from "../../../../../main-ui/classes/logic"
import { UnseenActivityIndicatorEvent, UnseenActivityIndicatorDependencies, UnseenActivityIndicatorState } from "./types"
import { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'

type EventHandler<EventName extends keyof UnseenActivityIndicatorEvent> = UIEventHandler<UnseenActivityIndicatorState, UnseenActivityIndicatorEvent, EventName>

export default class UnseenActivityIndicatorLogic extends UILogic<UnseenActivityIndicatorState, UnseenActivityIndicatorEvent> {
    _user: UserReference | null = null

    constructor(private dependencies: UnseenActivityIndicatorDependencies) {
        super()

        this.subscribeToServiceEvent(this.dependencies.services.auth, 'changed', () => {
            console.log('auth change')
            this._update()
        })
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
        if (this._user?.id == user?.id) {
            return // there was no change in user
        }
        this._user = user

        this.emitMutation({
            isAuthenticated: { $set: !!user },
            $unset: ['hasUnseen']
        })
        if (!user) {
            delete this._user
            return // TODO: Reset indicator
        }

        const [latestActivityTimestamp, homeFeedTimestamp] = await Promise.all([
            this.dependencies.services.activityStreams.getHomeFeedInfo().then(info => info.latestActivityTimestamp),
            this.dependencies.storage.activityStreams.retrieveHomeFeedTimestamp({
                user: user,
            }).then((result) => result?.timestamp ?? null)
        ])

        this.emitMutation({
            hasUnseen: { $set: hasUnseenActivities({ latestActivityTimestamp, homeFeedTimestamp }) },
        })
    }
}

function hasUnseenActivities(params: {
    latestActivityTimestamp: number | null,
    homeFeedTimestamp: number | null,
}) {
    if (!params.latestActivityTimestamp) {
        return false
    }
    if (!params.homeFeedTimestamp) {
        return true
    }
    return params.latestActivityTimestamp > params.homeFeedTimestamp
}
