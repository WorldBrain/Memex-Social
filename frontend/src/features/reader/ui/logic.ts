import {
    GetAnnotationsResult,
    GetAnnotationListEntriesResult,
} from '@worldbrain/memex-common/lib/content-sharing/storage/types'
import { GetAnnotationListEntriesElement } from '@worldbrain/memex-common/lib/content-sharing/storage/types'
import {
    SharedAnnotationReference,
    SharedListReference,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import { makeStorageReference } from '@worldbrain/memex-common/lib/storage/references'
import { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import { mapValues } from 'lodash'
import chunk from 'lodash/chunk'
import flatten from 'lodash/flatten'
import {
    UILogic,
    UIEventHandler,
    executeUITask,
} from '../../../main-ui/classes/logic'
import {
    annotationConversationEventHandlers,
    annotationConversationInitialState,
    detectAnnotationConversationThreads,
    intializeNewPageReplies,
    setupConversationLogicDeps,
} from '../../content-conversations/ui/logic'
import { getInitialAnnotationConversationStates } from '../../content-conversations/ui/utils'
import UserProfileCache from '../../user-management/utils/user-profile-cache'
import { setupIframeComms } from '../utils/iframe'
import { getWebsiteHTML } from '../utils/api'
import { injectHtml } from '../utils/utils'
import {
    ReaderPageViewDependencies,
    ReaderPageViewEvent,
    ReaderPageViewState,
} from './types'

type EventHandler<EventName extends keyof ReaderPageViewEvent> = UIEventHandler<
    ReaderPageViewState,
    ReaderPageViewEvent,
    EventName
>

export class ReaderPageViewLogic extends UILogic<
    ReaderPageViewState,
    ReaderPageViewEvent
> {
    users: UserProfileCache
    pageAnnotationPromises: { [normalizedPageUrl: string]: Promise<void> } = {}
    conversationThreadPromises: {
        [normalizePageUrl: string]: Promise<void>
    } = {}

    readerContainerRef?: HTMLDivElement
    cleanupIframeComms?: () => void

    constructor(private dependencies: ReaderPageViewDependencies) {
        super()

        this.users = new UserProfileCache({
            ...dependencies,
            onUsersLoad: (users) => {
                this.emitMutation({ users: { $merge: users } })
            },
        })

        Object.assign(
            this,
            annotationConversationEventHandlers<ReaderPageViewState>(
                this as any,
                {
                    ...this.dependencies,
                    ...setupConversationLogicDeps(this.dependencies),
                    selectAnnotationData: (state, reference) => {
                        const annotationId = this.dependencies.storage.contentSharing.getSharedAnnotationLinkID(
                            reference,
                        )
                        const annotation: GetAnnotationsResult[string] =
                            state.annotations[annotationId]
                        if (!annotation) {
                            return null
                        }
                        return {
                            normalizedPageUrl: annotation.normalizedPageUrl,
                            pageCreatorReference: annotation.creator,
                        }
                    },
                    loadUserByReference: (reference) =>
                        this.users.loadUser(reference),
                    onNewAnnotationCreate: (_, annotation, sharedListEntry) => {
                        this.emitMutation({
                            annotations: {
                                [annotation.linkId]: {
                                    $set: annotation,
                                },
                            },
                            annotationEntryData: {
                                [annotation.normalizedPageUrl]: {
                                    $apply: (
                                        previousState?: GetAnnotationListEntriesElement[],
                                    ) => [
                                        ...(previousState ?? []),
                                        {
                                            ...sharedListEntry!,
                                            creator: annotation.creator,
                                            sharedAnnotation:
                                                annotation.reference,
                                        },
                                    ],
                                },
                            },
                        })
                        return this.dependencies.services.userMessages.pushMessage(
                            {
                                type: 'created-annotation',
                                sharedAnnotationId: annotation.reference.id,
                            },
                        )
                    },
                },
            ),
        )
    }

    getInitialState(): ReaderPageViewState {
        return {
            listLoadState: 'pristine',
            users: {},
            annotationEntriesLoadState: 'pristine',
            annotationLoadStates: {},
            annotations: {},
            sidebarWidth: 400,
            isYoutubeVideo: false,
            reportURLSuccess: false,
            showInstallTooltip: false,
            ...annotationConversationInitialState(),
        }
    }

    init: EventHandler<'init'> = async () => {
        const { contentSharing } = this.dependencies.storage
        const listReference = makeStorageReference<SharedListReference>(
            'shared-list-reference',
            this.dependencies.listID,
        )

        await executeUITask<ReaderPageViewState>(
            this,
            'listLoadState',
            async () => {
                const isStaging =
                    process.env.REACT_APP_FIREBASE_PROJECT_ID?.includes(
                        'staging',
                    ) || process.env.NODE_ENV === 'development'

                const baseUrl = isStaging
                    ? 'https://staging.memex.social/c/'
                    : 'https://memex.social/c/'

                const result = await contentSharing.retrieveList(
                    listReference,
                    {
                        fetchSingleEntry: this.dependencies.entryID
                            ? {
                                  type:
                                      'shared-annotation-list-entry-reference',
                                  id: this.dependencies.entryID,
                              }
                            : undefined,
                    },
                )

                const listEntry = result.entries[0]
                const normalizedPageUrl = listEntry.normalizedUrl

                if (normalizedPageUrl.startsWith('https://www.youtube.com/')) {
                    this.emitMutation({
                        isYoutubeVideo: { $set: true },
                    })
                }

                this.emitMutation({
                    listData: {
                        $set: {
                            reference: listReference,
                            creatorReference: result.creator,
                            creator: await this.users.loadUser(result.creator),
                            list: result.sharedList,
                            entry: listEntry,
                            title: result.sharedList.title,
                            url: baseUrl + result.sharedList.reference.id,
                        },
                    },
                })

                const annotationEntriesByList = await contentSharing.getAnnotationListEntriesForListsOnPage(
                    {
                        listReferences: [listReference],
                        normalizedPageUrl,
                    },
                )
                const entries = annotationEntriesByList[listReference.id] ?? []
                if (!entries.length) {
                    return
                }

                this.emitMutation({
                    annotationEntryData: {
                        $set: { [listEntry.normalizedUrl]: entries },
                    },
                })

                if (this.readerContainerRef) {
                    this.initializeReader(
                        this.readerContainerRef,
                        listEntry.originalUrl,
                    )
                }

                await this.loadPageAnnotations(
                    { [normalizedPageUrl]: entries },
                    [normalizedPageUrl],
                )
            },
        )
    }

    cleanup: EventHandler<'cleanup'> = async () => {
        this.cleanupIframeComms?.()
    }

    setReaderContainerRef: EventHandler<'setReaderContainerRef'> = async (
        incoming,
    ) => {
        const { ref } = incoming.event
        if (ref) {
            this.readerContainerRef = ref
            const { entry } = incoming.previousState.listData ?? {}
            if (entry) {
                this.initializeReader(ref, entry.originalUrl)
            }
        } else {
            this.cleanupIframeComms?.()
        }
    }
    installMemexClick: EventHandler<'installMemexClick'> = async (incoming) => {
        await trySendingURLToOpenToExtension(
            incoming.event.urlToOpen,
            incoming.event.sharedListReference,
        )

        window.open(
            'https://chrome.google.com/webstore/detail/memex/abkfbakhjpmblaafnpgjppbmioombali?hl=en',
            '_blank',
        )
    }
    setSidebarWidth: EventHandler<'setSidebarWidth'> = async (incoming) => {
        const { width } = incoming.event
        if (width) {
            this.emitMutation({
                sidebarWidth: { $set: width },
            })
        }
    }
    reportUrl: EventHandler<'reportUrl'> = async (incoming) => {
        const { url } = incoming.event

        console.log('url', url)

        const isStaging =
            process.env.REACT_APP_FIREBASE_PROJECT_ID?.includes('staging') ||
            process.env.NODE_ENV === 'development'

        const baseUrl = isStaging
            ? 'https://cloudflare-memex-staging.memex.workers.dev'
            : 'https://cloudfare-memex.memex.workers.dev'

        this.emitMutation({
            reportURLSuccess: { $set: true },
            showInstallTooltip: { $set: true },
        })

        const date = new Date(Date.now())
        const formattedDate = `${
            (date.getDate() < 10 ? '0' : '') + date.getDate()
        }.${
            (date.getMonth() + 1 < 10 ? '0' : '') + (date.getMonth() + 1)
        }.${date.getFullYear().toString().slice(-2)} ${
            (date.getHours() < 10 ? '0' : '') + date.getHours()
        }:${(date.getMinutes() < 10 ? '0' : '') + date.getMinutes()}:${
            (date.getSeconds() < 10 ? '0' : '') + date.getSeconds()
        }`

        const dateFormatted = formattedDate.toString()

        try {
            await fetch(baseUrl + '/report-url', {
                method: 'POST',
                body: JSON.stringify({
                    url,
                    date: dateFormatted,
                }),
                headers: { 'Content-Type': 'application/json' },
            })
            setTimeout(() => {
                this.emitMutation({
                    reportURLSuccess: { $set: false },
                })
            }, 2000)
        } catch (e) {
            setTimeout(() => {
                this.emitMutation({
                    reportURLSuccess: { $set: false },
                })
            }, 2000)
        }
    }
    closeInstallTooltip: EventHandler<'closeInstallTooltip'> = async (
        incoming,
    ) => {
        this.emitMutation({
            showInstallTooltip: { $set: false },
        })
    }

    async initializeReader(ref: HTMLDivElement, originalUrl: string) {
        const response = await getWebsiteHTML(originalUrl)
        if (!response || this.cleanupIframeComms) {
            return
        }

        const { url, html } = response
        this.cleanupIframeComms = setupIframeComms({
            sendMessageFromIframe(message) {
                console.log('got message from iframe', message)
            },
        }).cleanup
        injectHtml(html, url, ref)
    }

    async loadPageAnnotations(
        annotationEntries: GetAnnotationListEntriesResult,
        normalizedPageUrls: string[],
    ) {
        const toFetch: Array<{
            normalizedPageUrl: string
            sharedAnnotation: SharedAnnotationReference
        }> = flatten(
            normalizedPageUrls
                .filter(
                    (normalizedPageUrl) =>
                        !this.pageAnnotationPromises[normalizedPageUrl],
                )
                .map((normalizedPageUrl) =>
                    (annotationEntries[normalizedPageUrl] ?? []).map(
                        (entry) => ({
                            normalizedPageUrl,
                            sharedAnnotation: entry.sharedAnnotation,
                        }),
                    ),
                ),
        )

        const promisesByPage: {
            [normalizedUrl: string]: Promise<GetAnnotationsResult>[]
        } = {}
        const annotationChunks: Promise<GetAnnotationsResult>[] = []
        const { contentSharing } = this.dependencies.storage
        for (const entryChunk of chunk(toFetch, 10)) {
            const pageUrlsInChuck = new Set(
                entryChunk.map((entry) => entry.normalizedPageUrl),
            )
            const promise = contentSharing.getAnnotations({
                references: entryChunk.map((entry) => entry.sharedAnnotation),
            })
            for (const normalizedPageUrl of pageUrlsInChuck) {
                promisesByPage[normalizedPageUrl] =
                    promisesByPage[normalizedPageUrl] ?? []
                promisesByPage[normalizedPageUrl].push(promise)
            }
            annotationChunks.push(promise)
        }

        const usersToLoad = new Set<UserReference['id']>()
        for (const normalizedPageUrl in promisesByPage) {
            this.pageAnnotationPromises[normalizedPageUrl] = (async (
                normalizedPageUrl: string,
                pagePromises: Promise<GetAnnotationsResult>[],
            ) => {
                this.emitMutation({
                    annotationLoadStates: {
                        [normalizedPageUrl]: { $set: 'running' },
                    },
                })

                try {
                    const annotationChunks = await Promise.all(pagePromises)
                    const newAnnotations: ReaderPageViewState['annotations'] = {}
                    for (const annotationChunk of annotationChunks) {
                        for (const [annotationId, annotation] of Object.entries(
                            annotationChunk,
                        )) {
                            newAnnotations[annotationId] = annotation
                        }
                    }
                    for (const newAnnotation of Object.values(newAnnotations)) {
                        usersToLoad.add(newAnnotation.creator.id)
                    }

                    const mutation = {
                        annotationLoadStates: {
                            [normalizedPageUrl]: { $set: 'success' },
                        },
                        annotations: mapValues(
                            newAnnotations,
                            (newAnnotation) => ({ $set: newAnnotation }),
                        ),
                    }
                    this.emitMutation(mutation as any)
                } catch (e) {
                    this.emitMutation({
                        annotationLoadStates: {
                            [normalizedPageUrl]: { $set: 'error' },
                        },
                    })
                    console.error(e)
                }
            })(normalizedPageUrl, promisesByPage[normalizedPageUrl])
        }

        const annotationReferences = flatten(
            Object.values(annotationEntries),
        ).map((entry) => entry.sharedAnnotation)
        this.emitMutation({
            conversations: {
                $merge: getInitialAnnotationConversationStates(
                    annotationReferences.map(({ id }) => ({
                        linkId: id.toString(),
                    })),
                ),
            },
        })
        const conversationThreadPromise = detectAnnotationConversationThreads(
            this as any,
            {
                getThreadsForAnnotations: (...args) =>
                    this.dependencies.storage.contentConversations.getThreadsForAnnotations(
                        ...args,
                    ),
                annotationReferences,
                sharedListReference: {
                    type: 'shared-list-reference',
                    id: this.dependencies.listID,
                },
            },
        ).catch(console.error)
        intializeNewPageReplies(this as any, {
            normalizedPageUrls: [...normalizedPageUrls].filter(
                (normalizedPageUrl) =>
                    !this.conversationThreadPromises[normalizedPageUrl],
            ),
        })

        for (const normalizedPageUrl of normalizedPageUrls) {
            this.conversationThreadPromises[
                normalizedPageUrl
            ] = conversationThreadPromise
        }

        try {
            const result = await Promise.all([
                ...normalizedPageUrls.map(
                    (normalizedPageUrl) =>
                        this.pageAnnotationPromises[normalizedPageUrl],
                ),
                ...normalizedPageUrls.map(
                    (normalizedPageUrl) =>
                        this.conversationThreadPromises[normalizedPageUrl],
                ),
            ])
            await this.users.loadUsers(
                [...usersToLoad].map(
                    (id): UserReference => ({
                        type: 'user-reference',
                        id,
                    }),
                ),
            )
            return result
        } catch (e) {
            throw e
        }
    }
}

const trySendingURLToOpenToExtension = async (
    url: string,
    sharedListReference: SharedListReference,
) => {
    let payload = JSON.stringify({
        type: 'pageToOpen',
        originalPageUrl: url,
        sharedListId: sharedListReference?.id as string,
    })
    console.log('sending message to extension', payload.toString())

    localStorage.setItem('urlAndSpaceToOpen', payload.toString())
}