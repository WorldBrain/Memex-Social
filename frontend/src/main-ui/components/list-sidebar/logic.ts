import { SharedList, SharedListReference } from "@worldbrain/memex-common/lib/content-sharing/types"
import { UILogic, UIEventHandler, loadInitial } from "../../classes/logic"
import { State, Dependencies, Events } from './types'

type EventHandler<EventName extends keyof Events> = UIEventHandler<
    State,
    Events,
    EventName
>

export default class Logic extends UILogic<State, Events> {
    constructor(private options: Dependencies) {
        super()
    }

    getInitialState() : State {
        return {
            followedLists: [],
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

        await loadInitial<State>(this, async () => {
            const follows = await serverModules.activityFollows.getAllFollowsByCollection({
                collection: 'sharedList', userReference,
            })

            const followedLists: Array<SharedList & {  reference: SharedListReference }> = []

            // TODO: Do this more efficiently - I think there needs to be a new method
            for (const { objectId } of follows) {
                const listReference: SharedListReference = {
                    type: 'shared-list-reference',
                    id: objectId,
                }
                const list = await serverModules.contentSharing.retrieveList(listReference)

                followedLists.push({
                    ...list?.sharedList!,
                    reference: listReference,
                })
            }

            this.emitMutation({
                followedLists: { $set: followedLists },
                isListShown: { $set: true },
            })
        })
    }

    clickSharedList: EventHandler<'clickSharedList'> = ({ event }) => {
        const { router } = this.options.services
        router.goTo('collectionDetails', { id: event.listReference.id as string })
    }
}
