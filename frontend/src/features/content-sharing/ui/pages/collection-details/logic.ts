import { SharedList, SharedListEntry } from "@worldbrain/memex-common/lib/content-sharing/types"
import { CollectionDetailsEvent, CollectionDetailsDependencies } from "./types"
import { UILogic, UIEventHandler, loadInitial } from "../../../../../main-ui/classes/logic"
import { UITaskState } from "../../../../../main-ui/types"
const truncate = require('truncate')

const LIST_DESCRIPTION_CHAR_LIMIT = 200

export interface CollectionDetailsState {
    loadState: UITaskState
    data?: {
        list: SharedList
        listEntries: SharedListEntry[]
        listDescriptionState: 'fits' | 'collapsed' | 'expanded'
        listDescriptionTruncated: string
    }
}
type EventHandler<EventName extends keyof CollectionDetailsEvent> = UIEventHandler<CollectionDetailsState, CollectionDetailsEvent, EventName>

export default class CollectionDetailsLogic extends UILogic<CollectionDetailsState, CollectionDetailsEvent> {
    constructor(private dependencies: CollectionDetailsDependencies) {
        super()
    }

    getInitialState(): CollectionDetailsState {
        return {
            loadState: 'pristine',
        }
    }

    init: EventHandler<'init'> = async () => {
        await loadInitial<CollectionDetailsState>(this, async () => {
            const contentSharing = this.dependencies.contentSharing
            const listReference = contentSharing.getSharedListReferenceFromLinkID(this.dependencies.listID)
            const result = await contentSharing.retrieveList(listReference)
            if (result) {
                const listDescription = result.sharedList.description ?? ''
                const listDescriptionFits = listDescription.length < LIST_DESCRIPTION_CHAR_LIMIT

                this.emitMutation({
                    data: {
                        $set: {
                            list: result.sharedList,
                            listEntries: result.entries,
                            listDescriptionState: listDescriptionFits ? 'fits' : 'collapsed',
                            listDescriptionTruncated: truncate(listDescription, LIST_DESCRIPTION_CHAR_LIMIT)
                        }
                    }
                })
            }
        })
    }

    // toggleDescriptionTruncation: EventHandler<'toggleDescriptionTruncation'> = () => {
    //     return { listDescriptionState: { $apply: state => state === 'collapsed' ? 'expanded' : 'collapsed' } }
    // }
}
