import chunk from 'lodash/chunk'
import fromPairs from 'lodash/fromPairs'
import { SharedList, SharedListEntry, SharedAnnotationReference } from "@worldbrain/memex-common/lib/content-sharing/types"
import { GetAnnotationListEntriesResult, GetAnnotationsResult } from "@worldbrain/memex-common/lib/content-sharing/storage/types"
import { CollectionDetailsEvent, CollectionDetailsDependencies } from "./types"
import { UILogic, UIEventHandler, executeUITask } from "../../../../../main-ui/classes/logic"
import { UITaskState } from "../../../../../main-ui/types"
import { UIMutation } from "ui-logic-core"
import flatten from 'lodash/flatten'
import { PAGE_SIZE } from './constants'
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
    allAnnotationExpanded: boolean
    pageAnnotationsExpanded: { [normalizedPageUrl: string]: true }
    annotationEntryData?: GetAnnotationListEntriesResult
    annotations: GetAnnotationsResult
}
type EventHandler<EventName extends keyof CollectionDetailsEvent> = UIEventHandler<CollectionDetailsState, CollectionDetailsEvent, EventName>

export default class CollectionDetailsLogic extends UILogic<CollectionDetailsState, CollectionDetailsEvent> {
    pageAnnotationPromises: { [normalizedPageUrl: string]: Promise<void> } = {}
    latestPageSeenIndex = 0

    constructor(private dependencies: CollectionDetailsDependencies) {
        super()
    }

    getInitialState(): CollectionDetailsState {
        return {
            listLoadState: 'pristine',
            annotationEntriesLoadState: 'pristine',
            annotationLoadStates: {},
            annotations: {},
            allAnnotationExpanded: false,
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

                return {
                    mutation: {
                        listData: {
                            $set: {
                                creatorDisplayName: user?.displayName,
                                list: result.sharedList,
                                listEntries: result.entries,
                                listDescriptionState: listDescriptionFits ? 'fits' : 'collapsed',
                                listDescriptionTruncated: truncate(listDescription, LIST_DESCRIPTION_CHAR_LIMIT)
                            }
                        }
                    }
                }
            }
        })
        await executeUITask<CollectionDetailsState>(this, 'annotationEntriesLoadState', async () => {
            const entries = await contentSharing.getAnnotationListEntries({
                listReference,
            })
            return {
                mutation: {
                    annotationEntryData: { $set: entries }
                }
            }
        })
    }

    toggleDescriptionTruncation: EventHandler<'toggleDescriptionTruncation'> = () => {
        const mutation: UIMutation<CollectionDetailsState> = {
            listData: { listDescriptionState: { $apply: state => state === 'collapsed' ? 'expanded' : 'collapsed' } }
        }
        return mutation
    }

    togglePageAnnotations: EventHandler<'togglePageAnnotations'> = incoming => {
        const state = incoming.previousState
        const shouldBeExpanded = !state.pageAnnotationsExpanded[incoming.event.normalizedUrl]
        const currentExpandedCount = Object.keys(state.pageAnnotationsExpanded).length
        const nextExpandedCount = currentExpandedCount + (shouldBeExpanded ? 1 : -1)
        const allAnnotationExpanded = nextExpandedCount === state.listData!.listEntries.length

        const mutation: UIMutation<CollectionDetailsState> = {
            pageAnnotationsExpanded: shouldBeExpanded
                ? {
                    [incoming.event.normalizedUrl]: {
                        $set: true
                    }
                }
                : {
                    $unset: [incoming.event.normalizedUrl]
                },
            allAnnotationExpanded: { $set: allAnnotationExpanded }
        }
        this.emitMutation(mutation)
        if (shouldBeExpanded) {
            this.loadPageAnnotations(state.annotationEntryData!, [incoming.event.normalizedUrl])
        }
    }

    toggleAllAnnotations: EventHandler<'toggleAllAnnotations'> = incoming => {
        const shouldBeExpanded = !incoming.previousState.allAnnotationExpanded
        if (shouldBeExpanded) {
            this.emitMutation({
                allAnnotationExpanded: { $set: true },
                pageAnnotationsExpanded: {
                    $set: fromPairs(incoming.previousState.listData!.listEntries.map(
                        entry => [entry.normalizedUrl, true]
                    ))
                }
            })
        } else {
            this.emitMutation({
                allAnnotationExpanded: { $set: false },
                pageAnnotationsExpanded: { $set: {} }
            })
        }
        const { latestPageSeenIndex, normalizedPageUrls } = this.getFirstPagesWithoutLoadedAnnotations(incoming.previousState)
        this.latestPageSeenIndex = latestPageSeenIndex
        this.loadPageAnnotations(
            incoming.previousState.annotationEntryData!,
            normalizedPageUrls
            // incoming.previousState.listData!.listEntries.map(entry => entry.normalizedUrl)
        )
    }

    pageBreakpointHit: EventHandler<'pageBreakpointHit'> = incoming => {
        if (incoming.event.entryIndex < this.latestPageSeenIndex) {
            return
        }

        const { latestPageSeenIndex, normalizedPageUrls } = this.getFirstPagesWithoutLoadedAnnotations(incoming.previousState)
        this.latestPageSeenIndex = latestPageSeenIndex
        this.loadPageAnnotations(incoming.previousState.annotationEntryData!, normalizedPageUrls)
    }

    getFirstPagesWithoutLoadedAnnotations(state: CollectionDetailsState) {
        const normalizedPageUrls: string[] = []
        let latestPageSeenIndex = 0
        for (const [entryIndex, { normalizedUrl }] of state.listData!.listEntries.slice(this.latestPageSeenIndex).entries()) {
            if (normalizedPageUrls.length >= PAGE_SIZE) {
                break
            }
            if (
                // state.annotationEntryData![normalizedUrl] &&
                !this.pageAnnotationPromises[normalizedUrl]
            ) {
                normalizedPageUrls.push(normalizedUrl)
            }
            latestPageSeenIndex = entryIndex
        }
        return { normalizedPageUrls, latestPageSeenIndex }
    }

    loadPageAnnotations(annotationEntries: GetAnnotationListEntriesResult, normalizedPageUrls: string[]) {
        const toFetch: Array<{ normalizedPageUrl: string, sharedAnnotation: SharedAnnotationReference }> = flatten(
            normalizedPageUrls
                .filter(normalizedPageUrl => !this.pageAnnotationPromises[normalizedPageUrl])
                .map(normalizedPageUrl => (annotationEntries[normalizedPageUrl] ?? []).map(
                    entry => ({ normalizedPageUrl, sharedAnnotation: entry.sharedAnnotation })
                ))
        )

        const promisesByPage: { [normalizedUrl: string]: Promise<GetAnnotationsResult>[] } = {}
        const annotationChunks: Promise<GetAnnotationsResult>[] = []
        const { contentSharing } = this.dependencies
        for (const entryChunk of chunk(toFetch, 10)) {
            const pageUrlsInChuck = new Set(entryChunk.map(entry => entry.normalizedPageUrl))
            const promise = contentSharing.getAnnotations({ references: entryChunk.map(entry => entry.sharedAnnotation) })
            for (const normalizedPageUrl of pageUrlsInChuck) {
                promisesByPage[normalizedPageUrl] = promisesByPage[normalizedPageUrl] ?? []
                promisesByPage[normalizedPageUrl].push(promise)
            }
            annotationChunks.push(promise)
        }

        for (const [normalizedPageUrl, pagePromises] of Object.entries(promisesByPage)) {
            this.emitMutation({
                annotationLoadStates: { [normalizedPageUrl]: { $set: 'running' } },
            })
            this.pageAnnotationPromises[normalizedPageUrl] = (async () => {
                try {
                    const annotationChunks = await Promise.all(pagePromises)
                    // await new Promise(resolve => setTimeout(resolve, 2000))
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
        }

        return Promise.all(normalizedPageUrls.map(
            normalizedPageUrl => this.pageAnnotationPromises[normalizedPageUrl]
        ))
    }
}
