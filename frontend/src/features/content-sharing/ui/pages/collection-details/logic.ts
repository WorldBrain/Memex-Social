import chunk from 'lodash/chunk'
import { SharedList, SharedListEntry } from "@worldbrain/memex-common/lib/content-sharing/types"
import { GetAnnotationListEntriesResult, GetAnnotationsResult } from "@worldbrain/memex-common/lib/content-sharing/storage/types"
import { CollectionDetailsEvent, CollectionDetailsDependencies } from "./types"
import { UILogic, UIEventHandler, loadInitial, executeUITask } from "../../../../../main-ui/classes/logic"
import { UITaskState } from "../../../../../main-ui/types"
import { UIMutation } from "ui-logic-core"
const truncate = require('truncate')

const LIST_DESCRIPTION_CHAR_LIMIT = 200

export interface CollectionDetailsState {
    listLoadState: UITaskState
    annotationEntriesLoadState: UITaskState
    annotationLoadStates: { [normalizedPageUrl: string]: UITaskState }
    listData?: {
        creatorDisplayName?: string
        list: SharedList
        listEntries: SharedListEntry[]
        listDescriptionState: 'fits' | 'collapsed' | 'expanded'
        listDescriptionTruncated: string
    },
    pageAnnotationsExpanded: { [normalizedPageUrl: string]: boolean }
    annotationEntryData?: GetAnnotationListEntriesResult
    annotations: GetAnnotationsResult
}
type EventHandler<EventName extends keyof CollectionDetailsEvent> = UIEventHandler<CollectionDetailsState, CollectionDetailsEvent, EventName>

export default class CollectionDetailsLogic extends UILogic<CollectionDetailsState, CollectionDetailsEvent> {
    pageAnnotationPromises: { [normalizedPageUrl: string]: Promise<void> } = {}

    constructor(private dependencies: CollectionDetailsDependencies) {
        super()
    }

    getInitialState(): CollectionDetailsState {
        return {
            listLoadState: 'pristine',
            annotationEntriesLoadState: 'pristine',
            annotationLoadStates: {},
            annotations: {},
            pageAnnotationsExpanded: {}
        }
    }

    init: EventHandler<'init'> = async () => {
        const { contentSharing, userManagement } = this.dependencies
        const listReference = contentSharing.getSharedListReferenceFromLinkID(this.dependencies.listID)
        await executeUITask<CollectionDetailsState>(this, 'listLoadState', async () => {
            const result = await contentSharing.retrieveList(listReference)
            if (result) {
                const user = await userManagement.getUser(result.creator)

                const listDescription = result.sharedList.description ?? ''
                const listDescriptionFits = listDescription.length < LIST_DESCRIPTION_CHAR_LIMIT

                this.emitMutation({
                    listData: {
                        $set: {
                            creatorDisplayName: user?.displayName,
                            list: result.sharedList,
                            listEntries: result.entries,
                            listDescriptionState: listDescriptionFits ? 'fits' : 'collapsed',
                            listDescriptionTruncated: truncate(listDescription, LIST_DESCRIPTION_CHAR_LIMIT)
                        }
                    }
                })
            }
        })
        await executeUITask<CollectionDetailsState>(this, 'annotationEntriesLoadState', async () => {
            const entries = await contentSharing.getAnnotationListEntries({
                listReference,
            })
            this.emitMutation({
                annotationEntryData: { $set: entries }
            })
        })
    }

    toggleDescriptionTruncation: EventHandler<'toggleDescriptionTruncation'> = () => {
        const mutation: UIMutation<CollectionDetailsState> = {
            listData: { listDescriptionState: { $apply: state => state === 'collapsed' ? 'expanded' : 'collapsed' } }
        }
        return mutation
    }

    togglePageAnnotations: EventHandler<'togglePageAnnotations'> = incoming => {
        this.emitMutation({
            pageAnnotationsExpanded: {
                [incoming.event.normalizedUrl]: {
                    $apply: state => !state
                }
            }
        })
        this.loadPageAnnotations(incoming.previousState.annotationEntryData!, incoming.event.normalizedUrl)
    }

    loadPageAnnotations(annotationEntries: GetAnnotationListEntriesResult, normalizedPageUrl: string) {
        if (this.pageAnnotationPromises[normalizedPageUrl]) {
            return this.pageAnnotationPromises[normalizedPageUrl]
        }

        this.pageAnnotationPromises[normalizedPageUrl] = (async () => {
            this.emitMutation({
                annotationLoadStates: {
                    [normalizedPageUrl]: { $set: 'running' }
                }
            })
            try {
                const { contentSharing } = this.dependencies
                const entryChunks = chunk(annotationEntries[normalizedPageUrl] ?? [], 10)
                const annotationChunks = await Promise.all(entryChunks.map(
                    entryChunk => contentSharing.getAnnotations({
                        references: entryChunk.map(entry => entry.sharedAnnotation)
                    })
                ))

                const newAnnotations: UIMutation<CollectionDetailsState['annotations']> = {}
                for (const annotationChunk of annotationChunks) {
                    for (const [annotationId, annotation] of Object.entries(annotationChunk)) {
                        newAnnotations[annotationId] = { $set: annotation }
                    }
                }

                this.emitMutation({
                    annotationLoadStates: { [normalizedPageUrl]: { $set: 'success' } },
                    annotations: newAnnotations
                })
            } catch (e) {
                this.emitMutation({
                    annotationLoadStates: {
                        [normalizedPageUrl]: { $set: 'error' }
                    }
                })
                console.error(e)
            }
        })()

        return this.pageAnnotationPromises[normalizedPageUrl]
    }
}
