import { UILogic, UIEvent, UIEventHandler, loadInitial } from "../../classes/logic"
import { SharedList, SharedListReference } from "@worldbrain/memex-common/lib/content-sharing/types"
import { UITaskState } from "../../types"
import { Services } from "../../../services/types"
import { Storage } from "../../../storage/types"

export interface Dependencies {
    services: Pick<Services, 'router' | 'auth'>
    storage: Pick<Storage, 'serverModules'>
}

export interface State {
    sharedLists: Array<SharedList & { reference: SharedListReference }>
    isListShown: boolean
    loadState: UITaskState
}

export type Event = UIEvent<{
    clickSharedList: { listRef: SharedListReference }
}>

type EventHandler<EventName extends keyof Event> = UIEventHandler<
    State,
    Event,
    EventName
>

export default class Logic extends UILogic<State, Event> {
    constructor(private options: Dependencies) {
        super()
    }

    getInitialState() : State {
        return {
            sharedLists: [],
            isListShown: false,
            loadState: 'pristine',
        }
    }

    init: EventHandler<'init'> = async ({ previousState }) => {
        const { serverModules } = this.options.storage
        const { auth } = this.options.services

        const userReference = auth.getCurrentUserReference()

        if (userReference == null) {
            return
        }

        // TODO: Sort out the type errors using `loadInitial` here
        // await loadInitial(this, async () => {
        const follows = await serverModules.activityFollows.getAllFollowsByCollection({
            collection: 'sharedList', userReference,
        })

        const sharedLists: Array<SharedList & {  reference: SharedListReference }> = []

        // TODO: Do this more efficiently - I think there needs to be a new method
        for (const { objectId } of follows) {
            const list = await serverModules.contentSharing.retrieveList({ type: 'shared-list-reference', id: objectId })

            // TODO: Figure out how to get list IDs
            // sharedLists.push({ ...list, reference: { type: 'shared-list-reference', id: list. } })
        }

        this.emitMutation({ sharedLists: { $set: sharedLists }})
        // })
    }

    clickSharedList: EventHandler<'clickSharedList'> = ({ event }) => {
        const { router } = this.options.services
        router.goTo('collectionDetails', { id: event.listRef.id as string })
    }
}
