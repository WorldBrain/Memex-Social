import chunk from 'lodash/chunk'
import fromPairs from 'lodash/fromPairs'
import { SharedAnnotationReference } from "@worldbrain/memex-common/lib/content-sharing/types"
import { GetAnnotationListEntriesResult, GetAnnotationsResult } from "@worldbrain/memex-common/lib/content-sharing/storage/types"
import { CollectionDetailsEvent, CollectionDetailsDependencies, CollectionDetailsSignal, CollectionDetailsState } from "./types"
import { UILogic, UIEventHandler, executeUITask } from "../../../../../main-ui/classes/logic"
import { UIMutation } from "ui-logic-core"
import flatten from 'lodash/flatten'
import { PAGE_SIZE } from './constants'
import { annotationConversationInitialState, annotationConversationEventHandlers } from '../../../../content-conversations/ui/logic'
import { UserReference, User } from '@worldbrain/memex-common/lib/web-interface/types/users'
import { getInitialAnnotationConversationStates } from '../../../../content-conversations/ui/utils'
import mapValues from 'lodash/mapValues'
const truncate = require('truncate')

const LIST_DESCRIPTION_CHAR_LIMIT = 200

type EventHandler<EventName extends keyof CollectionDetailsEvent> = UIEventHandler<CollectionDetailsState, CollectionDetailsEvent, EventName>

export default class CollectionDetailsLogic extends UILogic<CollectionDetailsState, CollectionDetailsEvent> {
    pageAnnotationPromises: { [normalizedPageUrl: string]: Promise<void> } = {}
    latestPageSeenIndex = 0
    users: { [id: string]: Promise<User | null> } = {}

    constructor(private dependencies: CollectionDetailsDependencies) {
        super()

        Object.assign(this, annotationConversationEventHandlers<CollectionDetailsState>(this as any, {
            ...this.dependencies,
            getAnnotation: (state, reference) => {
                const annotationId = this.dependencies.storage.contentSharing.getSharedAnnotationLinkID(reference)
                const annotation = state.annotations[annotationId]
                if (!annotation) {
                    return null
                }
                return { annotation, pageCreatorReference: annotation.creator, }
            },
            loadUser: this._loadUser,
        }))
    }

    getInitialState(): CollectionDetailsState {
        return {
            listLoadState: 'pristine',
            annotationEntriesLoadState: 'pristine',
            annotationLoadStates: {},
            annotations: {},
            allAnnotationExpanded: false,
            pageAnnotationsExpanded: {},
            ...annotationConversationInitialState(),
        }
    }

    init: EventHandler<'init'> = async () => {
        const { contentSharing, userManagement } = this.dependencies.storage
        const listReference = contentSharing.getSharedListReferenceFromLinkID(this.dependencies.listID)
        const { success: listDataSuccess } = await executeUITask<CollectionDetailsState>(this, 'listLoadState', async () => {
            this.emitSignal<CollectionDetailsSignal>({ type: 'loading-started' })

            const result = await contentSharing.retrieveList(listReference)
            if (result) {
                const user = await userManagement.getUser(result.creator)

                const listDescription = result.sharedList.description ?? ''
                const listDescriptionFits = listDescription.length < LIST_DESCRIPTION_CHAR_LIMIT

                return {
                    mutation: {
                        listData: {
                            $set: {
                                creatorReference: result.creator,
                                creator: user,
                                list: result.sharedList,
                                listEntries: result.entries,
                                listDescriptionState: listDescriptionFits ? 'fits' : 'collapsed',
                                listDescriptionTruncated: truncate(listDescription, LIST_DESCRIPTION_CHAR_LIMIT)
                            }
                        },
                    }
                }
            }
        })
        this.emitSignal<CollectionDetailsSignal>({ type: 'loaded-list-data', success: listDataSuccess })
        const { success: annotationEntriesSuccess } = await executeUITask<CollectionDetailsState>(this, 'annotationEntriesLoadState', async () => {
            const entries = await contentSharing.getAnnotationListEntries({
                listReference,
            })
            return {
                mutation: {
                    annotationEntryData: { $set: entries }
                }
            }
        })
        this.emitSignal<CollectionDetailsSignal>({ type: 'loaded-annotation-entries', success: annotationEntriesSuccess })
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

    async loadPageAnnotations(annotationEntries: GetAnnotationListEntriesResult, normalizedPageUrls: string[]) {
        this.emitSignal<CollectionDetailsSignal>({ type: 'annotation-loading-started' })

        const toFetch: Array<{ normalizedPageUrl: string, sharedAnnotation: SharedAnnotationReference }> = flatten(
            normalizedPageUrls
                .filter(normalizedPageUrl => !this.pageAnnotationPromises[normalizedPageUrl])
                .map(normalizedPageUrl => (annotationEntries[normalizedPageUrl] ?? []).map(
                    entry => ({ normalizedPageUrl, sharedAnnotation: entry.sharedAnnotation })
                ))
        )

        const promisesByPage: { [normalizedUrl: string]: Promise<GetAnnotationsResult>[] } = {}
        const annotationChunks: Promise<GetAnnotationsResult>[] = []
        const { contentSharing } = this.dependencies.storage
        for (const entryChunk of chunk(toFetch, 10)) {
            const pageUrlsInChuck = new Set(entryChunk.map(entry => entry.normalizedPageUrl))
            const promise = contentSharing.getAnnotations({ references: entryChunk.map(entry => entry.sharedAnnotation) })
            for (const normalizedPageUrl of pageUrlsInChuck) {
                promisesByPage[normalizedPageUrl] = promisesByPage[normalizedPageUrl] ?? []
                promisesByPage[normalizedPageUrl].push(promise)
            }
            annotationChunks.push(promise)
        }

        for (const promisesByPageEntry of Object.entries(promisesByPage)) {
            this.pageAnnotationPromises[promisesByPageEntry[0]] = (async ([normalizedPageUrl, pagePromises]: [string, Promise<GetAnnotationsResult>[]]) => {
                this.emitMutation({
                    annotationLoadStates: { [normalizedPageUrl]: { $set: 'running' } },
                })

                try {
                    const annotationChunks = await Promise.all(pagePromises)
                    // await new Promise(resolve => setTimeout(resolve, 2000))
                    const newAnnotations: CollectionDetailsState['annotations'] = {}
                    for (const annotationChunk of annotationChunks) {
                        for (const [annotationId, annotation] of Object.entries(annotationChunk)) {
                            newAnnotations[annotationId] = annotation
                        }
                    }

                    const mutation = {
                        annotationLoadStates: { [normalizedPageUrl]: { $set: 'success' } },
                        annotations: mapValues(newAnnotations, newAnnotation => ({ $set: newAnnotation })),
                        conversations: { $merge: getInitialAnnotationConversationStates(Object.values(newAnnotations)) },
                    }
                    this.emitMutation(mutation as any)
                } catch (e) {
                    this.emitMutation({
                        annotationLoadStates: {
                            [normalizedPageUrl]: { $set: 'error' }
                        }
                    })
                    console.error(e)
                }
            })(promisesByPageEntry)
        }

        try {
            const result = await Promise.all(normalizedPageUrls.map(normalizedPageUrl => this.pageAnnotationPromises[normalizedPageUrl]))
            this.emitSignal<CollectionDetailsSignal>({ type: 'loaded-annotations', success: true })
            return result
        } catch (e) {
            this.emitSignal<CollectionDetailsSignal>({ type: 'loaded-annotations', success: false })
            throw e
        }
    }

    _loadUser = async (userReference: UserReference): Promise<User | null> => {
        if (this.users[userReference.id]) {
            return this.users[userReference.id]
        }

        const user = this.dependencies.storage.userManagement.getUser(userReference)
        this.users[userReference.id] = user
        return user
    }
}
