import { SharedList, SharedListEntry } from "@worldbrain/memex-common/lib/content-sharing/types"
import { CollectionDetailsEvent } from "./types"
import { UILogic, UIEventHandler } from "../../../../../main-ui/classes/logic"
const truncate = require('truncate')

export interface CollectionDetailsState {
    list: SharedList
    listEntries: SharedListEntry[]
    listDescriptionState: 'fits' | 'collapsed' | 'expanded'
    listDescriptionTruncated: string
}
type EventHandler<EventName extends keyof CollectionDetailsEvent> = UIEventHandler<CollectionDetailsState, CollectionDetailsEvent, EventName>

export default class CollectionDetailsLogic extends UILogic<CollectionDetailsState, CollectionDetailsEvent> {
    getInitialState(): CollectionDetailsState {
        const listDescription = 'A new breed of note-taking tools. Here is a collection of tools for networked thoughts. '.repeat(5)
        const listDescriptionCharLimit = 200
        const listDescriptionFits = listDescription.length < listDescriptionCharLimit
        return {
            list: {
                createdWhen: Date.now(),
                updatedWhen: Date.now(),
                title: 'Productivity Tools: Networked Thoughts',
                description: listDescription
            },
            listEntries: [
                {
                    createdWhen: Date.now(),
                    updatedWhen: Date.now(),
                    entryTitle: `WorldBrain's Memex`,
                    normalizedUrl: 'getmemex.com',
                    originalUrl: 'https://getmemex.com',
                },
                {
                    createdWhen: Date.now(),
                    updatedWhen: Date.now(),
                    entryTitle: `Notion`,
                    normalizedUrl: 'notion.so',
                    originalUrl: 'https://notion.so',
                },
            ],
            listDescriptionState: listDescriptionFits ? 'fits' : 'collapsed',
            listDescriptionTruncated: truncate(listDescription, listDescriptionCharLimit)
        }
    }

    toggleDescriptionTruncation: EventHandler<'toggleDescriptionTruncation'> = () => {
        return { listDescriptionState: { $apply: state => state === 'collapsed' ? 'expanded' : 'collapsed' } }
    }
}
