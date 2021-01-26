import chunk from 'lodash/chunk'
import fromPairs from 'lodash/fromPairs'
import { SharedAnnotationReference, SharedList, SharedListReference } from "@worldbrain/memex-common/lib/content-sharing/types"
import { GetAnnotationListEntriesResult, GetAnnotationsResult } from "@worldbrain/memex-common/lib/content-sharing/storage/types"
import { CollectionDetailsEvent, CollectionDetailsDependencies, CollectionDetailsSignal, CollectionDetailsState } from "./types"
import { UILogic, UIEventHandler, executeUITask } from "../../../../../main-ui/classes/logic"
import { UIMutation } from "ui-logic-core"
import flatten from 'lodash/flatten'
import { PAGE_SIZE } from './constants'
import { annotationConversationInitialState, annotationConversationEventHandlers, detectAnnotationConversationsThreads } from '../../../../content-conversations/ui/logic'
import { getInitialAnnotationConversationStates } from '../../../../content-conversations/ui/utils'
import mapValues from 'lodash/mapValues'
import UserProfileCache from '../../../../user-management/utils/user-profile-cache'
const truncate = require('truncate')

const LIST_DESCRIPTION_CHAR_LIMIT = 200

type EventHandler<EventName extends keyof CollectionDetailsEvent> = UIEventHandler<CollectionDetailsState, CollectionDetailsEvent, EventName>

export default class CollectionDetailsLogic extends UILogic<CollectionDetailsState, CollectionDetailsEvent> {
    pageAnnotationPromises: { [normalizedPageUrl: string]: Promise<void> } = {}
    conversationThreadPromises: { [normalizePageUrl: string]: Promise<void> } = {}
    latestPageSeenIndex = 0
    _users: UserProfileCache

    constructor(private dependencies: CollectionDetailsDependencies) {
        super()

        this._users = new UserProfileCache(dependencies)

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
            loadUser: reference => this._users.loadUser(reference),
        }))
    }

    getInitialState(): CollectionDetailsState {
        return {
            listLoadState: 'pristine',
            followLoadState: 'pristine',
            listSidebarLoadState: 'pristine',
            annotationEntriesLoadState: 'pristine',
            annotationLoadStates: {},
            annotations: {},
            isCollectionFollowed: false,
            allAnnotationExpanded: false,
            isListSidebarShown: false,
            pageAnnotationsExpanded: {},
            followedLists: [],
            ...annotationConversationInitialState(),
        }
    }

    init: EventHandler<'init'> = async () => {
        const { contentSharing, users } = this.dependencies.storage
        const listReference = contentSharing.getSharedListReferenceFromLinkID(this.dependencies.listID)
        const { success: listDataSuccess } = await executeUITask<CollectionDetailsState>(this, 'listLoadState', async () => {
            this.emitSignal<CollectionDetailsSignal>({ type: 'loading-started' })

            const result = await contentSharing.retrieveList(listReference)
            if (result) {
                const user = await users.getUser(result.creator)

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
        await this.loadListSidebarState()
    }

    private async loadListSidebarState() {
        const { activityFollows, contentSharing } = this.dependencies.storage
        const { auth } = this.dependencies.services

        const userReference = auth.getCurrentUserReference()

        if (userReference == null) {
            return
        }

        await executeUITask<CollectionDetailsState>(this, 'listSidebarLoadState', async () => {
            const follows = await activityFollows.getAllFollowsByCollection({
                collection: 'sharedList', userReference,
            })

            const followedLists: Array<SharedList & {  reference: SharedListReference }> = []

            // TODO: Do this more efficiently - I think there needs to be a new method
            for (const { objectId } of follows) {
                const listReference: SharedListReference = {
                    type: 'shared-list-reference',
                    id: objectId,
                }
                const list = await contentSharing.retrieveList(listReference)

                followedLists.push({
                    ...list?.sharedList!,
                    reference: listReference,
                })
            }

            this.emitMutation({
                followedLists: { $set: followedLists },
                isListSidebarShown: { $set: true },
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

    clickFollowBtn: EventHandler<'clickFollowBtn'> = async ({ previousState }) => {
        const { services: { auth }, storage: { activityFollows }, listID } = this.dependencies
        let userReference = auth.getCurrentUserReference()

        // TODO: figure out what to properly do here
        if (userReference === null) {
            const { result } = await auth.requestAuth()

            if (result.status !== 'authenticated' && result.status !== 'registered-and-authenticated') {
                return
            }

            userReference = auth.getCurrentUserReference()!
        }

        const entityArgs = {
            userReference,
            objectId: listID,
            collection: 'sharedList',
        }

        await executeUITask<CollectionDetailsState>(this, 'followLoadState', async () => {
            const isAlreadyFollowed = await activityFollows.isEntityFollowedByUser(entityArgs)

            if (isAlreadyFollowed) {
                await activityFollows.deleteFollow(entityArgs)
            } else {
                await activityFollows.storeFollow(entityArgs)
            }

            this.emitMutation({
                isCollectionFollowed: { $set: !isAlreadyFollowed }
             })
        })
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

        const conversationThreadPromise = detectAnnotationConversationsThreads(this as any, [...normalizedPageUrls].filter(
            normalizedPageUrl => !this.conversationThreadPromises[normalizedPageUrl]
        ), {
            storage: this.dependencies.storage,
        }).catch(() => { })
        for (const normalizedPageUrl of normalizedPageUrls) {
            this.conversationThreadPromises[normalizedPageUrl] = conversationThreadPromise
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
}
