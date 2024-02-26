import React from 'react'
import ReactDOM from 'react-dom'
import html2canvas from 'html2canvas'
import { ThemeProvider, StyleSheetManager } from 'styled-components'
import createResolvable from '@josephg/resolvable'
import Tooltip from '@worldbrain/memex-common/lib/in-page-ui/tooltip/container'
import { conditionallyTriggerTooltip } from '@worldbrain/memex-common/lib/in-page-ui/tooltip/utils'
import {
    TOOLTIP_HOST_ID,
    TOOLTIP_CONTAINER_ID,
} from '@worldbrain/memex-common/lib/in-page-ui/tooltip/constants'
import { theme } from '../../../../src/main-ui/styles/theme'
import {
    GetAnnotationsResult,
    SharedCollectionType,
} from '@worldbrain/memex-common/lib/content-sharing/storage/types'
import type { GetAnnotationListEntriesElement } from '@worldbrain/memex-common/lib/content-sharing/storage/types'
import {
    SharedAnnotation,
    SharedAnnotationReference,
    SharedListReference,
    SharedListRoleID,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import { makeStorageReference } from '@worldbrain/memex-common/lib/storage/references'
import type { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import {
    HighlightRenderer,
    Dependencies as HighlightRendererDeps,
} from '@worldbrain/memex-common/lib/in-page-ui/highlighting/renderer'
import mapValues from 'lodash/mapValues'
import flatten from 'lodash/flatten'
import {
    UILogic,
    UIEventHandler,
    executeUITask,
} from '../../../main-ui/classes/logic'
import type { UIMutation } from '@worldbrain/memex-common/lib/main-ui/classes/logic'
import {
    annotationConversationEventHandlers,
    annotationConversationInitialState,
    detectAnnotationConversationThreads,
    intializeNewPageReplies,
    setupConversationLogicDeps,
} from '../../content-conversations/ui/logic'
import {
    getInitialAnnotationConversationState,
    getInitialAnnotationConversationStates,
} from '../../content-conversations/ui/utils'
import UserProfileCache from '../../user-management/utils/user-profile-cache'
import * as utils from '../utils/utils'
import {
    ReaderPageViewDependencies,
    ReaderPageViewEvent,
    ReaderPageViewState,
} from './types'
import type {
    AnnotationClickHandler,
    RenderableAnnotation,
    SaveAndRenderHighlightDeps,
} from '@worldbrain/memex-common/lib/in-page-ui/highlighting/types'
import {
    getAnnotationVideoLink,
    getVideoLinkInfo,
} from '@worldbrain/memex-common/lib/editor/utils'
import type {
    IconKeys,
    MemexTheme,
} from '@worldbrain/memex-common/lib/common-ui/styles/types'
import type { UploadStorageUtils } from '@worldbrain/memex-common/lib/personal-cloud/backend/translation-layer/storage-utils'
import { createPersonalCloudStorageUtils } from '@worldbrain/memex-common/lib/content-sharing/storage/utils'
import { userChanges } from '../../../services/auth/utils'
import type { AutoPk } from '../../../types'
import { doesMemexExtDetectionElExist } from '@worldbrain/memex-common/lib/common-ui/utils/content-script'
import { doesUrlPointToPdf } from '@worldbrain/memex-common/lib/page-indexing/utils'
import { determineEnv } from '../../../utils/runtime-environment'
import { CLOUDFLARE_WORKER_URLS } from '@worldbrain/memex-common/lib/content-sharing/storage/constants'
import { getListShareUrl } from '@worldbrain/memex-common/lib/content-sharing/utils'
import {
    AnnotationsSorter,
    sortByCreatedTime,
    sortByPagePosition,
} from '@worldbrain/memex-common/lib/annotations/sorting'
import {
    editableAnnotationsEventHandlers,
    editableAnnotationsInitialState,
} from '../../annotations/ui/logic'
import type { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'
import { sleepPromise } from '../../../utils/promises'
import { LoggedOutAccessBox } from '../../content-sharing/ui/pages/collection-details/space-access-box'
import sanitizeHTMLhelper from '@worldbrain/memex-common/lib/utils/sanitize-html-helper'
import { processCommentForImageUpload } from '@worldbrain/memex-common/lib/annotations/processCommentForImageUpload'
import { promptPdfScreenshot } from '@worldbrain/memex-common/lib/pdf/screenshots/selection'
import type { PdfScreenshotAnchor } from '@worldbrain/memex-common/lib/annotations/types'
import type { ImageSupportInterface } from '@worldbrain/memex-common/lib/image-support/types'

type EventHandler<EventName extends keyof ReaderPageViewEvent> = UIEventHandler<
    ReaderPageViewState,
    ReaderPageViewEvent,
    EventName
>

// TODO: Switch to the upstream version once merged in and updated
const emitAndApplyMutation = <S,>(logic: UILogic<S, any>) => (
    previousState: S,
    mutation: UIMutation<S>,
): S => {
    const nextState = logic.withMutation(previousState, mutation)
    logic.emitMutation(mutation)
    return nextState
}

export class ReaderPageViewLogic extends UILogic<
    ReaderPageViewState,
    ReaderPageViewEvent
> {
    private emitAndApplyMutation = emitAndApplyMutation(this)
    private users: UserProfileCache
    private isReaderInitialized = false
    private sidebarRef: HTMLElement | null = null
    private highlightRenderer!: HighlightRenderer
    /**
     * This is only used as a way to create sync entries when we update annotation comments here.
     * TODO: Possibly move this to a storage hook.
     */
    private personalCloudStorageUtils: UploadStorageUtils | null = null
    private pageAnnotationPromises: {
        [normalizedPageUrl: string]: Promise<void>
    } = {}
    private conversationThreadPromises: {
        [normalizePageUrl: string]: Promise<void>
    } = {}
    private cleanupIframeTooltipShowListeners?: () => void
    private listCreator = createResolvable<UserReference>()
    private iframeSetupResolvable = createResolvable()
    iframe: HTMLIFrameElement | null = null

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
            editableAnnotationsEventHandlers<ReaderPageViewState>(this as any, {
                ...this.dependencies,
                getHighlightRenderer: () => this.highlightRenderer,
                getPersonalCloudStorageUtils: () =>
                    this.personalCloudStorageUtils,
                imageSupport: this.dependencies.imageSupport,
            }),
        )

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
                            annotationEditStates: {
                                [annotation.linkId]: {
                                    $set: {
                                        isEditing: false,
                                        loadState: 'pristine',
                                        comment: annotation.comment ?? '',
                                    },
                                },
                            },
                            annotationHoverStates: {
                                [annotation.linkId]: {
                                    $set: {
                                        isHovering: false,
                                    },
                                },
                            },
                            annotationDeleteStates: {
                                [annotation.linkId]: {
                                    $set: {
                                        isDeleting: false,
                                        deleteState: 'pristine',
                                    },
                                },
                            },
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
                                        {
                                            ...sharedListEntry!,
                                            creator: annotation.creator,
                                            sharedAnnotation:
                                                annotation.reference,
                                        },
                                        ...(previousState ?? []),
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
            sourceUrl: null,
            annotationEntriesLoadState: 'running',
            permissionsLoadState: 'pristine',
            iframeLoadState: 'running',
            joinListState: 'pristine',
            listLoadState: 'pristine',
            annotationCreateState: {
                loadState: 'pristine',
                isCreating: false,
                comment: '',
            },
            annotationLoadStates: {},
            users: {},
            sidebarWidth: 450,
            activeAnnotationId: null,
            collaborationKey: null,
            joinListResult: null,
            permissions: null,
            showShareMenu: false,
            isYoutubeVideo: false,
            reportURLSuccess: false,
            showInstallTooltip: false,
            linkCopiedToClipBoard: false,
            showOptionsMenu: false,
            showSidebar: true,
            renderAnnotationInstructOverlay: false,
            showSupportChat: false,
            preventInteractionsInIframe: false,
            showDropPDFNotice: false,
            openOriginalStatus: 'pristine',
            overlayModalState: null,
            ...editableAnnotationsInitialState(),
            ...annotationConversationInitialState(),
        }
    }

    init: EventHandler<'init'> = async (incoming) => {
        await this.dependencies.services.auth.waitForAuthReady()
        await this.processUIEvent('load', {
            ...incoming,
            event: { isUpdate: false },
        })

        const isMemexInstalled = doesMemexExtDetectionElExist()

        if (!isMemexInstalled) {
            const pageLinkCreationCounter = JSON.parse(
                localStorage.getItem('pageLinkCreationCounter') || '[]',
            )
            // show the install tooltip every 2, 5, 10, 20 times the user creates a page link
            if (
                pageLinkCreationCounter.length === 2 ||
                pageLinkCreationCounter.length === 5 ||
                pageLinkCreationCounter.length === 10 ||
                pageLinkCreationCounter.length === 20
            ) {
                this.emitMutation({
                    overlayModalState: { $set: 'installTools' },
                })
            }
        }
    }

    load: EventHandler<'load'> = async ({ previousState }) => {
        const { services } = this.dependencies
        const keyString = services.listKeys.getCurrentKey()
        const listReference = makeStorageReference<SharedListReference>(
            'shared-list-reference',
            this.dependencies.listID,
        )
        const currentUser = services.auth.getCurrentUser()

        await executeUITask<ReaderPageViewState>(
            this,
            'listLoadState',
            async () => {
                const response = await services.contentSharing.backend.loadCollectionDetails(
                    {
                        listId: this.dependencies.listID,
                        entryId: this.dependencies.entryID,
                        keyString: keyString ?? undefined,
                    },
                )
                if (response.status !== 'success') {
                    if (response.status === 'permission-denied') {
                        await this.users.loadUser({
                            type: 'user-reference',
                            id: response.data.creator,
                        })
                        const permissionDeniedData = {
                            ...response.data,
                            hasKey: !!keyString,
                        }
                        // TODO: figure out what we're doing view-wise with perm denied private list reader links
                        // this.emitMutation({
                        //   permissionDenied: { $set: permissionDeniedData },
                        // })
                        if (!currentUser) {
                            await services.auth.requestAuth({
                                header: (
                                    <LoggedOutAccessBox
                                        keyString={keyString}
                                        permissionDenied={permissionDeniedData}
                                    />
                                ),
                            })
                            this.processUIEvent('load', {
                                event: { isUpdate: false },
                                previousState,
                            })
                        }
                    }
                    return
                }
                const { data } = response

                const baseListRoles =
                    data.rolesByList[this.dependencies.listID] ?? []
                this.listCreator.resolve(data.retrievedList.creator)
                const myListRole =
                    currentUser != null
                        ? baseListRoles.find(
                              (role) => role.user.id === currentUser.id,
                          )
                        : undefined
                let nextState = await this.loadPermissions(
                    previousState,
                    myListRole?.roleID,
                )

                if (data.collaborationKey != null) {
                    nextState = this.emitAndApplyMutation(nextState, {
                        collaborationKey: {
                            $set: data.collaborationKey,
                        },
                    })
                }

                const listEntry = data.retrievedList.entries[0]
                // Ensure any hash fragment is removed. Got to here as some PDFs had hash fragments which broke our .endsWith('.pdf') checks
                //  TODO: make more robust
                const entrySourceUrl = new URL(listEntry.sourceUrl)
                entrySourceUrl.hash = ''
                let sourceUrl = entrySourceUrl.href

                if (this.dependencies.pdfBlob) {
                    const objectUrl = URL.createObjectURL(
                        this.dependencies.pdfBlob,
                    )
                    sourceUrl = objectUrl
                }

                document.title = listEntry.entryTitle ?? ''

                const isMemexInstalled = doesMemexExtDetectionElExist()
                const shouldNotOpenLink =
                    services.router.getQueryParam('noAutoOpen') === 'true' ||
                    window.location.href.includes('noAutoOpen=true')

                const isOwnLink = nextState.permissions === 'owner'
                const userAgent = navigator.userAgent
                if (
                    isMemexInstalled &&
                    nextState.currentUserReference != null &&
                    !shouldNotOpenLink
                ) {
                    const sharedListId = listReference.id as string
                    const isCollaborationLink = !!services.router.getQueryParam(
                        'key',
                    )

                    if (/Firefox/i.test(userAgent)) {
                        // Create a new DOM element, let's assume it's a `div`
                        const injectedElement = document.createElement('div')

                        // Set an ID so the MutationObserver can identify it
                        injectedElement.id =
                            'openPageInSelectedListModeTriggerElement'

                        // Attach the necessary data as data attributes
                        injectedElement.setAttribute('sourceurl', sourceUrl)
                        injectedElement.setAttribute(
                            'sharedlistid',
                            sharedListId,
                        )
                        injectedElement.setAttribute(
                            'iscollaboratorlink',
                            isCollaborationLink.toString(),
                        )
                        injectedElement.setAttribute(
                            'isownlink',
                            isOwnLink.toString(),
                        )

                        // Append the element to the body (or any other parent element)
                        document.body.appendChild(injectedElement)
                        await sleepPromise(500)
                        injectedElement.remove()
                        services.router.delQueryParam('noAutoOpen')
                    } else {
                        await this.dependencies.services?.memexExtension.openLink(
                            {
                                originalPageUrl: sourceUrl,
                                sharedListId: sharedListId as string,
                                isCollaboratorLink: isCollaborationLink,
                                isOwnLink: isOwnLink,
                            },
                        )
                    }
                }

                if (shouldNotOpenLink && determineEnv() === 'production') {
                    services.router.delQueryParam('noAutoOpen')
                }

                let overLayModalStateValue: ReaderPageViewState['overlayModalState'] = null

                if (services.router.getQueryParam('key') && !isOwnLink) {
                    overLayModalStateValue = 'invitedForCollaboration'
                }

                nextState = this.emitAndApplyMutation(nextState, {
                    annotationLoadStates: {
                        [listEntry.normalizedUrl]: { $set: 'running' },
                    },
                    sourceUrl: { $set: sourceUrl },
                    isYoutubeVideo: {
                        $set: listEntry.normalizedUrl.startsWith(
                            'youtube.com/',
                        ),
                    },
                    overlayModalState: {
                        $set: overLayModalStateValue ?? null,
                    },
                    listData: {
                        $set: {
                            reference: listReference,
                            creatorReference: data.retrievedList.creator,
                            creator: await this.users.loadUser(
                                data.retrievedList.creator,
                            ),
                            list: data.retrievedList.sharedList,
                            entry: listEntry,
                            title: data.retrievedList.sharedList.title,
                            url: getListShareUrl({
                                remoteListId: data.retrievedList.sharedList.reference.id.toString(),
                            }),
                        },
                    },
                })

                const entries =
                    data.annotationEntries[listEntry.normalizedUrl] ?? []

                if (!entries.length) {
                    nextState = this.emitAndApplyMutation(nextState, {
                        annotationLoadStates: {
                            [listEntry.normalizedUrl]: { $set: 'success' },
                        },
                    })
                    return
                }

                nextState = this.emitAndApplyMutation(nextState, {
                    annotationEntryData: {
                        $set: { [listEntry.normalizedUrl]: entries },
                    },
                })

                const usersToLoad = new Set<UserReference['id']>()
                const annotations = response.data.annotations
                const annotationEntryData = response.data.annotationEntries
                const normalizedPageUrl = listEntry.normalizedUrl

                if (annotations) {
                    for (const newAnnotation of Object.values(annotations)) {
                        usersToLoad.add(newAnnotation.creator.id)
                        if (!newAnnotation.selector) {
                            continue
                        }
                    }
                }

                nextState = this.emitAndApplyMutation(nextState, {
                    annotationLoadStates: {
                        [normalizedPageUrl]: { $set: 'success' },
                    },
                    annotations: mapValues(annotations, (newAnnotation) => ({
                        $set: newAnnotation,
                    })),
                    annotationEditStates: mapValues(
                        annotations,
                        (newAnnotation) => ({
                            $set: {
                                isEditing: false,
                                loadState: 'pristine',
                                comment: newAnnotation.comment ?? '',
                            },
                        }),
                    ) as any,
                    annotationHoverStates: mapValues(
                        annotations,
                        (newAnnotation) => ({
                            $set: { isHovering: false },
                        }),
                    ),
                    annotationDeleteStates: mapValues(
                        annotations,
                        (newAnnotation) => ({
                            $set: {
                                isDeleting: false,
                                deleteState: 'pristine' as UITaskState,
                            },
                        }),
                    ),
                    // Sort annot entries first by created time, then by highlight position in page (if highlight)
                    annotationEntryData: mapValues(
                        annotationEntryData,
                        (entries) => {
                            const annotationsByEntryLookup = new Map<
                                AutoPk,
                                SharedAnnotation
                            >()
                            for (const entry of entries) {
                                if (
                                    annotations &&
                                    annotations[
                                        entry.sharedAnnotation.id.toString()
                                    ]
                                ) {
                                    annotationsByEntryLookup.set(
                                        entry.reference.id,
                                        annotations[
                                            entry.sharedAnnotation.id.toString()
                                        ],
                                    )
                                }
                            }
                            const initEntriesSorter = (
                                sortFn: AnnotationsSorter,
                            ) => (
                                a: GetAnnotationListEntriesElement,
                                b: GetAnnotationListEntriesElement,
                            ) =>
                                sortFn(
                                    annotationsByEntryLookup.get(
                                        a.reference.id,
                                    )!,
                                    annotationsByEntryLookup.get(
                                        b.reference.id,
                                    )!,
                                )

                            return {
                                $set: entries
                                    .sort(initEntriesSorter(sortByCreatedTime))
                                    .sort(
                                        initEntriesSorter(sortByPagePosition),
                                    ),
                            }
                        },
                    ),
                })

                // const intervalId = setInterval(() => {
                //     if (this.iframeLoaded && !isYoutube) {
                //         clearInterval(intervalId)
                //         this.loadPageAnnotations(
                //             { [listEntry.normalizedUrl]: entries },
                //             [listEntry.normalizedUrl],
                //             nextState,
                //         )
                //     }
                // }, 100)
                await this.renderHighlightsInState(nextState)

                const annotationReferences = flatten(
                    Object.values(annotationEntryData),
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

                this.conversationThreadPromises[
                    normalizedPageUrl
                ] = detectAnnotationConversationThreads(this as any, {
                    getThreadsForAnnotations: (...args) =>
                        this.dependencies.storage.contentConversations.getThreadsForAnnotations(
                            ...args,
                        ),
                    annotationReferences,
                    sharedListReference: {
                        type: 'shared-list-reference',
                        id: this.dependencies.listID,
                    },
                    imageSupport: this.dependencies.imageSupport,
                }).catch(console.error)

                intializeNewPageReplies(this as any, {
                    normalizedPageUrls: [...normalizedPageUrl].filter(
                        (normalizedPageUrl) =>
                            !this.conversationThreadPromises[normalizedPageUrl],
                    ),
                    imageSupport: this.dependencies.imageSupport,
                })

                try {
                    const result = await Promise.all([
                        this.pageAnnotationPromises[normalizedPageUrl],
                        this.conversationThreadPromises[normalizedPageUrl],
                    ])
                    await this.users.loadUsers(
                        [...usersToLoad].map(
                            (id): UserReference => ({
                                type: 'user-reference',
                                id,
                            }),
                        ),
                    )
                    return
                } catch (e) {
                    throw e
                }
            },
            // const isYoutube = listEntry.normalizedUrl.startsWith(
            //     'youtube.com/',
            // )

            // console.log('annotations', response.data.annotations)

            // if (isYoutube) {
            //     this.loadPageAnnotations(
            //         { [listEntry.normalizedUrl]: entries },
            //         [listEntry.normalizedUrl],
            //         nextState,
            //     )
            // }
        )
    }

    cleanup: EventHandler<'cleanup'> = async ({ previousState }) => {
        this.cleanupIframeTooltipShowListeners?.()

        if (
            this.dependencies.pdfBlob != null &&
            previousState.sourceUrl != null
        ) {
            URL.revokeObjectURL(previousState.sourceUrl)
        }
    }

    private async listenToUserChanges() {
        const userReference = this.dependencies.services.auth.getCurrentUserReference()

        if (!userReference) {
            for await (const user of userChanges(
                this.dependencies.services.auth,
            )) {
                if (user != null) {
                    this.isReaderInitialized = false // Flag reader for re-initialization on user change
                    setTimeout(() => {
                        window.location.reload()
                    }, 1500)
                } else {
                    this.emitMutation({
                        collaborationKey: { $set: null },
                        permissions: { $set: null },
                    })
                }
            }
        }
    }

    private async loadPermissions(
        previousState: ReaderPageViewState,
        listRole?: SharedListRoleID,
    ): Promise<ReaderPageViewState> {
        const { auth, router, listKeys } = this.dependencies.services
        let nextState = previousState
        await executeUITask<ReaderPageViewState>(
            this,
            'permissionsLoadState',
            async () => {
                await auth.waitForAuthReady()
                const userReference = auth.getCurrentUserReference()

                nextState = this.emitAndApplyMutation(nextState, {
                    currentUserReference: { $set: userReference },
                })

                if (!userReference) {
                    this.listenToUserChanges()
                    return
                }

                this.personalCloudStorageUtils = await createPersonalCloudStorageUtils(
                    {
                        userId: userReference.id,
                        storageManager: this.dependencies.storageManager,
                    },
                )

                // Shortcut: Use the key from the URL param if it's present
                const keyString = router.getQueryParam('key')
                if (keyString?.length) {
                    nextState = this.emitAndApplyMutation(nextState, {
                        collaborationKey: { $set: keyString },
                        permissions: { $set: 'contributor' },
                    })
                }

                // TODO: Is this necessary?
                if (listRole == null) {
                    const creator = (await this.listCreator) ?? undefined
                    if (creator.id === userReference.id) {
                        listRole = SharedListRoleID.Owner
                    }
                }

                if (listRole == null) {
                    if (keyString?.length) {
                        await executeUITask<ReaderPageViewState>(
                            this,
                            'joinListState',
                            async () => {
                                const keyString = router.getQueryParam('key')
                                if (!keyString?.length) {
                                    return
                                }

                                const {
                                    result,
                                } = await listKeys.processCurrentKey({
                                    type: SharedCollectionType.PageLink,
                                })
                                this.emitMutation({
                                    joinListResult: { $set: result },
                                })
                            },
                        )
                    }
                    return
                }

                const isOwner = listRole === SharedListRoleID.Owner
                nextState = this.emitAndApplyMutation(nextState, {
                    permissions: { $set: isOwner ? 'owner' : 'contributor' },
                })
            },
        )
        return nextState
    }

    setReaderContainerRef: EventHandler<'setReaderContainerRef'> = async ({
        event,
        previousState,
    }) => {
        if (event.ref) {
            if (previousState.sourceUrl) {
                await this.initializeReader(event.ref, previousState)
            }
        }
    }

    private async initializeReader(
        containerEl: HTMLDivElement,
        state: ReaderPageViewState,
    ) {
        const { router } = this.dependencies.services

        if (!this.isReaderInitialized) {
            this.isReaderInitialized = true
        } else {
            return
        }

        const isPdf =
            doesUrlPointToPdf(state.sourceUrl!) ||
            this.dependencies.pdfBlob != null

        let pdfJsViewer
        await executeUITask<ReaderPageViewState>(
            this,
            'iframeLoadState',
            async () => {
                if (isPdf) {
                    this.iframe = utils.createIframeForPDFViewer()
                } else {
                    const url = state.sourceUrl
                    this.iframe = utils.createReaderIframe()

                    // const scope = window.location.pathname
                    const scope = '/'

                    // also add inject of custom.js as a script into each replayed page
                    const swRegistration = await navigator.serviceWorker.register(
                        '/webrecorder-sw.js?injectScripts=/webrecorder-custom.js',
                        { scope },
                    )

                    const proxyPrefix =
                        'https://wabac-cors-proxy.memex.workers.dev/proxy/'
                    let initedResolve: (() => void) | null = null

                    const inited = new Promise<void>(
                        (resolve) => (initedResolve = resolve),
                    )

                    navigator.serviceWorker.addEventListener(
                        'message',
                        (event) => {
                            if (event.data.msg_type === 'collAdded') {
                                // the replay is ready to be loaded when this message is received
                                initedResolve!()
                            }
                        },
                    )

                    const baseUrl = new URL(window.location as any)
                    baseUrl.hash = ''

                    const msg = {
                        msg_type: 'addColl',
                        name: 'liveproxy',
                        type: 'live',
                        file: { sourceUrl: `proxy:${proxyPrefix}` },
                        skipExisting: false,
                        extraConfig: {
                            prefix: proxyPrefix,
                            isLive: true,
                            baseUrl: baseUrl.href,
                            baseUrlHashReplay: true,
                            noPostToGet: true,
                            allowBody: true,
                        },
                    }

                    if (!swRegistration.active) {
                        navigator.serviceWorker.addEventListener(
                            'controllerchange',
                            () => {
                                swRegistration.active!.postMessage(msg)
                            },
                        )
                    } else {
                        swRegistration.active.postMessage(msg)
                    }

                    if (inited) {
                        await inited
                    }

                    let iframeUrl = `/w/liveproxy/mp_/${url}`
                    this.iframe.src = iframeUrl
                }
                containerEl.appendChild(this.iframe)
                await utils.waitForIframeLoad(this.iframe)

                if (isPdf) {
                    const isLocalPDF =
                        state?.sourceUrl != null &&
                        state?.sourceUrl.includes('memex.cloud/ct/')
                    // Get PDFViewer from now-loaded iframe
                    pdfJsViewer = (this.iframe.contentWindow as any)[
                        'PDFViewerApplication'
                    ]
                    if (!pdfJsViewer) {
                        throw new Error(
                            'PDF.js viewer script did not load inside iframe',
                        )
                    }
                    if (isLocalPDF) {
                        this.emitMutation({
                            showDropPDFNotice: { $set: true },
                        })
                        // await utils.loadPDFInViewer(pdfJsViewer, null)
                    } else {
                        await utils.loadPDFInViewer(
                            pdfJsViewer,
                            state.sourceUrl!,
                        )
                    }
                }
            },
        )

        if (!this.iframe) {
            return
        }
        this.highlightRenderer = new HighlightRenderer({
            getWindow: () => this.iframe!.contentWindow,
            getDocument: () => this.iframe!.contentDocument,
            scheduleAnnotationCreation: this.scheduleAnnotationCreation,
            icons: (iconName: IconKeys) => theme.icons[iconName],
            createHighlight: async (
                selection,
                shouldShare,
                shouldCopyShareLink,
                drawRectangle,
            ) => {
                if (this.createHighlightExec) {
                    await this.createHighlightExec(
                        selection,
                        shouldShare,
                        drawRectangle as boolean,
                        state,
                        this.iframe as HTMLIFrameElement,
                    )
                }
            },
        })

        // fixes loading issue by making sure the PDF viewer is loaded before we try to render highlights
        while (isPdf && this.highlightRenderer.pdfViewer == null) {
            await sleepPromise(100)
            this.highlightRenderer = new HighlightRenderer({
                getWindow: () => this.iframe!.contentWindow,
                getDocument: () => this.iframe!.contentDocument,
                scheduleAnnotationCreation: this.scheduleAnnotationCreation,
                icons: (iconName: IconKeys) => theme.icons[iconName],
                createHighlight: async (
                    selection,
                    shouldShare,
                    drawRectangle,
                ) => {
                    if (this.createHighlightExec) {
                        await this.createHighlightExec(
                            selection,
                            shouldShare,
                            drawRectangle as boolean,
                            state,
                            this.iframe as HTMLIFrameElement,
                        )
                    }
                },
            })
        }

        const keyString = router.getQueryParam('key')
        if (state.permissions != null || keyString != null) {
            this.setupIframeTooltip(this.iframe, state)
        }
        this.iframeSetupResolvable.resolve()
    }

    private setupIframeTooltip(
        iframe: HTMLIFrameElement,
        state: ReaderPageViewState,
    ): void {
        const shadowRootContainer = document.createElement('div')
        shadowRootContainer.id = TOOLTIP_CONTAINER_ID // NOTE: this needs to be here else tooltip won't auto-hide on click away (see <ClickAway> comp)
        iframe.contentDocument?.body.appendChild(shadowRootContainer)
        const shadowRoot = shadowRootContainer?.attachShadow({ mode: 'open' })
        let showTooltipCb = () => {}

        if (!shadowRoot) {
            throw new Error('Shadow DOM could not be attached to iframe')
        }

        // Create a div for the React rendering of the tooltip component (inside the shadow DOM)
        const reactContainer = document.createElement('div')
        shadowRoot.appendChild(reactContainer)

        const fixedTheme: MemexTheme = {
            ...theme,
            icons: { ...theme.icons },
        }

        // Image blob URLs need to have the origin prefixed
        for (const [key, value] of Object.entries(fixedTheme.icons)) {
            // Let data URLs be - they don't need origin prefixing

            try {
                if (value.startsWith('data:')) {
                    continue
                }
                fixedTheme.icons[key as keyof MemexTheme['icons']] =
                    window.origin + value
            } catch (e) {
                console.log(e)
            }
        }

        ReactDOM.render(
            <StyleSheetManager target={shadowRoot as any}>
                <ThemeProvider theme={fixedTheme}>
                    <Tooltip
                        getRootElement={() =>
                            iframe.contentDocument
                                ?.getElementById(TOOLTIP_CONTAINER_ID)
                                ?.shadowRoot?.getElementById(
                                    TOOLTIP_HOST_ID,
                                ) as HTMLElement
                        }
                        hideAddToSpaceBtn
                        getWindow={() => iframe.contentWindow!}
                        createHighlight={async (
                            selection,
                            shouldShare,
                            drawRectangle,
                        ) => {
                            {
                                if (this.createHighlightExec && selection) {
                                    await this.createHighlightExec(
                                        selection,
                                        shouldShare ?? false,
                                        drawRectangle as boolean,
                                        state,
                                        iframe,
                                    )
                                }
                            }
                        }}
                        createAnnotation={async (selection, shouldShare) => {
                            if (state.currentUserReference == null) {
                                this.dependencies.services.auth.requestAuth({
                                    reason: 'login-requested',
                                })
                                return
                            } else {
                                await this.highlightRenderer.saveAndRenderHighlight(
                                    this.getRenderHighlightParams({
                                        selection,
                                        shouldShare,
                                        openInEditMode: true,
                                        screenShotAnchor: undefined,
                                        screenShotImage: undefined,
                                        imageSupport: this.dependencies
                                            .imageSupport,
                                        state,
                                    }),
                                )
                            }
                        }}
                        onTooltipInit={(showTooltip) => {
                            showTooltipCb = showTooltip
                        }}
                        context={'reader'}
                    />
                </ThemeProvider>
            </StyleSheetManager>,
            reactContainer,
        )

        const showTooltipListener = async (event: MouseEvent | TouchEvent) => {
            await conditionallyTriggerTooltip(
                {
                    getWindow: () => iframe.contentWindow!,
                    triggerTooltip: showTooltipCb,
                },
                event,
            )
        }

        iframe.contentDocument?.body.addEventListener(
            'mouseup',
            showTooltipListener,
        )
        iframe.contentDocument?.body.addEventListener(
            'touchend',
            showTooltipListener,
        )

        this.cleanupIframeTooltipShowListeners = () => {
            iframe.contentDocument?.body.removeEventListener(
                'mouseup',
                showTooltipListener,
            )
            iframe.contentDocument?.body.removeEventListener(
                'touchend',
                showTooltipListener,
            )
        }
    }

    private createHighlightExec: HighlightRendererDeps['createHighlightExec'] = async (
        selection?: Selection | undefined,
        shouldShare?: boolean,
        drawRectangle?: boolean | undefined,
        state?: ReaderPageViewState,
        iframe?: HTMLIFrameElement | null,
    ) => {
        if (state?.currentUserReference == null) {
            this.dependencies.services.auth.requestAuth({
                reason: 'login-requested',
            })
            return
        } else {
            let screenshotGrabResult
            let pdfViewer

            const isIframe = iframe!.contentWindow

            if (isIframe) {
                pdfViewer = (isIframe as any)['PDFViewerApplication']?.pdfViewer
            }

            let result
            if (pdfViewer && drawRectangle) {
                screenshotGrabResult = await promptPdfScreenshot(
                    iframe!.contentDocument,
                    iframe!.contentWindow,
                    {
                        htmlElToCanvasEl: (el) => html2canvas(el),
                    },
                )
                if (
                    screenshotGrabResult == null ||
                    screenshotGrabResult.anchor == null
                ) {
                    return
                } else {
                    result = await this.highlightRenderer.saveAndRenderHighlight(
                        this.getRenderHighlightParams({
                            selection: null,
                            shouldShare,
                            openInEditMode: false,
                            screenShotAnchor: screenshotGrabResult.anchor,
                            screenShotImage: screenshotGrabResult.screenshot,
                            imageSupport: this.dependencies.imageSupport,
                            state,
                        }),
                    )
                }
            }
            result = await this.highlightRenderer.saveAndRenderHighlight(
                this.getRenderHighlightParams({
                    selection,
                    shouldShare,
                    openInEditMode: false,
                    screenShotAnchor: undefined,
                    screenShotImage: undefined,
                    imageSupport: this.dependencies.imageSupport,
                    state,
                }),
            )

            // TODO: Do something with result (part of it is a Promise)
        }
    }

    private getRenderHighlightParams = (args: {
        selection?: Selection | null
        shouldShare?: boolean | null
        openInEditMode?: boolean | null
        screenShotAnchor?: PdfScreenshotAnchor | undefined
        screenShotImage?: HTMLCanvasElement | undefined
        imageSupport?: ImageSupportInterface
        state?: ReaderPageViewState
    }): SaveAndRenderHighlightDeps => {
        const currentUser =
            this.dependencies.services.auth.getCurrentUserReference() ??
            undefined
        if (!currentUser) {
            throw new Error('No user logged in')
        }

        return {
            currentUser,
            isPdf: doesUrlPointToPdf(args.state?.sourceUrl!),
            shouldShare: args.shouldShare ?? undefined,
            openInEditMode: args.openInEditMode ?? undefined,
            onClick: this.handleHighlightClick,
            getSelection: () => args.selection ?? null,
            getFullPageUrl: async () =>
                args.state?.listData?.entry.originalUrl!,
            screenshotAnchor: args.screenShotAnchor,
            screenshotImage: args.screenShotImage,
            imageSupport: args.imageSupport,
        }
    }

    private setModalState: EventHandler<'setModalState'> = async ({
        event,
    }) => {
        this.emitMutation({
            overlayModalState: { $set: event },
        })
    }

    private scheduleAnnotationCreation: HighlightRendererDeps['scheduleAnnotationCreation'] = async (
        annotationData,
        openInEditMode,
    ) => {
        const {
            services,
            storage,
            generateServerId,
            normalizeUrl,
        } = this.dependencies
        const normalizedPageUrl = normalizeUrl(annotationData.fullPageUrl)
        const creator = services.auth.getCurrentUserReference()
        if (!creator) {
            throw new Error('No user logged in')
        }
        const annotationId = generateServerId('sharedAnnotation')
        const annotationRef: SharedAnnotationReference = {
            type: 'shared-annotation-reference',
            id: annotationId,
        }
        const listRef: SharedListReference = {
            type: 'shared-list-reference',
            id: this.dependencies.listID,
        }

        let sanitizedAnnotation

        if (annotationData.comment && annotationData.comment.length > 0) {
            sanitizedAnnotation = sanitizeHTMLhelper(
                annotationData.comment?.trim(),
            )
        }

        let annotationCommentWithImages = sanitizedAnnotation
        if (sanitizedAnnotation) {
            annotationCommentWithImages = await processCommentForImageUpload(
                sanitizedAnnotation,
                normalizedPageUrl,
                annotationId,
                this.dependencies.imageSupport,
                false,
            )
        }

        if (openInEditMode) {
            this.emitMutation({
                showSidebar: { $set: true },
            })
        }

        // Update UI state (TODO: Why are the types messed up enough that I need to `as any` here?)
        this.emitMutation({
            annotationEditStates: {
                [annotationId]: {
                    $set: {
                        isEditing: !!openInEditMode,
                        comment: sanitizedAnnotation ?? '',
                        loadState: 'pristine',
                    },
                },
            } as any,
            annotationHoverStates: {
                [annotationId]: {
                    $set: {
                        isHovering: false,
                    },
                },
            },
            annotationDeleteStates: {
                [annotationId]: {
                    $set: {
                        isDeleting: false,
                        deleteState: 'pristine' as UITaskState,
                    },
                },
            },
            annotations: {
                [annotationId]: {
                    $set: {
                        creator,
                        normalizedPageUrl,
                        linkId: annotationId,
                        reference: annotationRef,
                        body: annotationData.body,
                        comment: annotationData.comment ?? undefined,
                        updatedWhen: annotationData.createdWhen,
                        createdWhen: annotationData.createdWhen,
                        uploadedWhen: annotationData.createdWhen,
                        selector: JSON.stringify(annotationData.selector),
                    },
                },
            } as any,
            annotationEntryData: {
                [normalizedPageUrl]: {
                    $apply: (
                        previousState?: GetAnnotationListEntriesElement[],
                    ) => [
                        {
                            creator,
                            normalizedPageUrl,
                            sharedList: listRef,
                            sharedAnnotation: annotationRef,
                            updatedWhen: annotationData.createdWhen,
                            createdWhen: annotationData.createdWhen,
                            uploadedWhen: annotationData.createdWhen,
                            reference: {
                                type: 'shared-annotation-list-entry-reference',
                                id: annotationId, // This will get overwritten with the actual list entry ID once write is done
                            },
                        },
                        ...(previousState ?? []),
                    ],
                },
            } as any,
            conversations: {
                [annotationId]: {
                    $set: {
                        ...getInitialAnnotationConversationState(),
                        hasThreadLoadLoadState: 'success',
                    },
                },
            } as any,
        })

        // Schedule DB entry creation
        const createPromise = storage.contentSharing
            .createAnnotations({
                creator,
                annotationsByPage: {
                    [normalizedPageUrl]: [
                        {
                            id: annotationId,
                            body: annotationData.body,
                            comment: annotationCommentWithImages ?? undefined,
                            selector: JSON.stringify(annotationData.selector),
                            createdWhen: annotationData.createdWhen,
                            localId: annotationId.toString(),
                        },
                    ],
                },
                listReferences: [
                    {
                        type: 'shared-list-reference',
                        id: this.dependencies.listID,
                    },
                ],
            })
            .then(({ sharedAnnotationListEntryReferences }) => {
                const ref =
                    sharedAnnotationListEntryReferences[
                        annotationId.toString()
                    ]?.[0]
                if (!ref) {
                    return
                }
                // Update newly created annotationEntryData entry with ID
                this.emitMutation({
                    annotationEntryData: {
                        [normalizedPageUrl]: {
                            $apply: (
                                previousState?: GetAnnotationListEntriesElement[],
                            ) => {
                                const dummyEntryIdx = previousState?.findIndex(
                                    (el) => el.reference.id === annotationId,
                                )
                                if (
                                    !previousState ||
                                    !dummyEntryIdx ||
                                    dummyEntryIdx === -1
                                ) {
                                    return previousState
                                }
                                previousState[dummyEntryIdx] = {
                                    ...previousState[dummyEntryIdx],
                                    reference: ref,
                                }
                                return previousState
                            },
                        },
                    } as any,
                })
            })

        return {
            annotationId,
            createPromise,
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
    toggleOptionsMenu: EventHandler<'toggleOptionsMenu'> = async (incoming) => {
        this.emitMutation({
            showOptionsMenu: { $set: !incoming.previousState.showOptionsMenu },
        })
    }
    hideDropZone: EventHandler<'hideDropZone'> = async (incoming) => {
        this.emitMutation({
            showDropPDFNotice: { $set: false },
        })
    }
    toggleSidebar: EventHandler<'toggleSidebar'> = async (incoming) => {
        if (incoming.event != null) {
            this.emitMutation({
                showSidebar: { $set: incoming.event },
            })
            return
        } else {
            this.emitMutation({
                showSidebar: { $set: !incoming.previousState.showSidebar },
            })
        }
    }

    reportUrl: EventHandler<'reportUrl'> = async (incoming) => {
        const { url } = incoming.event

        const baseUrl =
            determineEnv() === 'production'
                ? CLOUDFLARE_WORKER_URLS.production
                : CLOUDFLARE_WORKER_URLS.staging

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
    showInstallTooltip: EventHandler<'showInstallTooltip'> = async (
        incoming,
    ) => {
        this.emitMutation({
            showInstallTooltip: { $set: true },
        })
    }
    openOriginalLink: EventHandler<'openOriginalLink'> = async (incoming) => {
        if (doesMemexExtDetectionElExist()) {
            this.emitMutation({
                openOriginalStatus: { $set: 'running' },
            })
            const userAgent = navigator.userAgent

            const sourceUrl = incoming.previousState.sourceUrl as string
            const sharedListId = incoming.previousState.listData?.reference
                .id as string
            const isCollaboratorLink =
                incoming.previousState.permissions === 'contributor'
            const isOwnLink = incoming.previousState.permissions === 'owner'

            if (/Firefox/i.test(userAgent)) {
                // Create a new DOM element, let's assume it's a `div`
                const injectedElement = document.createElement('div')

                // Set an ID so the MutationObserver can identify it
                injectedElement.id = 'openPageInSelectedListModeTriggerElement'

                // Attach the necessary data as data attributes
                injectedElement.setAttribute('sourceurl', sourceUrl)
                injectedElement.setAttribute('sharedlistid', sharedListId)
                injectedElement.setAttribute(
                    'iscollaboratorlink',
                    isCollaboratorLink.toString(),
                )
                injectedElement.setAttribute('isownlink', isOwnLink.toString())

                // Append the element to the body (or any other parent element)
                document.body.appendChild(injectedElement)
                await sleepPromise(500)
                injectedElement.remove()
            } else {
                await this.dependencies.services?.memexExtension.openLink({
                    originalPageUrl: sourceUrl,
                    sharedListId: sharedListId,
                    isCollaboratorLink: isCollaboratorLink,
                    isOwnLink: isOwnLink,
                })
            }

            await sleepPromise(10000)
            this.emitMutation({
                openOriginalStatus: { $set: 'success' },
            })
        } else {
            window.open(incoming.previousState.sourceUrl as string, '_blank')
        }
    }
    showSharePageMenu: EventHandler<'showSharePageMenu'> = async (incoming) => {
        this.emitMutation({
            showShareMenu: { $set: !incoming.previousState.showShareMenu },
        })
    }
    toggleSupportChat: EventHandler<'toggleSupportChat'> = async (incoming) => {
        this.emitMutation({
            showSupportChat: { $set: !incoming.previousState.showSupportChat },
            preventInteractionsInIframe: {
                $set: !incoming.previousState.preventInteractionsInIframe,
            },
        })
    }
    toggleClickBlocker: EventHandler<'toggleClickBlocker'> = async (
        incoming,
    ) => {
        this.emitMutation({
            preventInteractionsInIframe: {
                $set: !incoming.previousState.preventInteractionsInIframe,
            },
        })
    }
    copyLink: EventHandler<'copyLink'> = async (incoming) => {
        this.emitMutation({
            linkCopiedToClipBoard: { $set: true },
        })

        // add incoming.url to clipboard
        if (incoming.event.url != null) {
            navigator.clipboard.writeText(incoming.event.url)
        }

        setTimeout(() => {
            this.emitMutation({
                linkCopiedToClipBoard: { $set: false },
            })
        }, 2000)
    }

    setSidebarRef: EventHandler<'setSidebarRef'> = ({ event }) => {
        if (event.ref) {
            this.sidebarRef = event.ref
        }
    }

    // private async loadPageAnnotations(
    //     annotations: SharedAnnotation[],
    //     annotationEntries: GetAnnotationListEntriesResult,
    //     normalizedPageUrls: string[],
    //     state: ReaderPageViewState,
    // ) {
    //     console.log('annotationEntries', annotationEntries)
    //     // const toFetch: Array<{
    //     //     normalizedPageUrl: string
    //     //     sharedAnnotation: SharedAnnotationReference
    //     // }> = flatten(
    //     //     normalizedPageUrls
    //     //         .filter(
    //     //             (normalizedPageUrl) =>
    //     //                 !this.pageAnnotationPromises[normalizedPageUrl],
    //     //         )
    //     //         .map((normalizedPageUrl) =>
    //     //             (annotationEntries[normalizedPageUrl] ?? []).map(
    //     //                 (entry) => ({
    //     //                     normalizedPageUrl,
    //     //                     sharedAnnotation: entry.sharedAnnotation,
    //     //                 }),
    //     //             ),
    //     //         ),
    //     // )

    //     // const promisesByPage: {
    //     //     [normalizedUrl: string]: Promise<GetAnnotationsResult>[]
    //     // } = {}
    //     // const annotationChunks: Promise<GetAnnotationsResult>[] = []
    //     // const { contentSharing } = this.dependencies.storage
    //     // for (const entryChunk of chunk(toFetch, 10)) {
    //     //     const pageUrlsInChuck = new Set(
    //     //         entryChunk.map((entry) => entry.normalizedPageUrl),
    //     //     )
    //     //     const promise = contentSharing.getAnnotations({
    //     //         references: entryChunk.map((entry) => entry.sharedAnnotation),
    //     //     })
    //     //     for (const normalizedPageUrl of pageUrlsInChuck) {
    //     //         promisesByPage[normalizedPageUrl] =
    //     //             promisesByPage[normalizedPageUrl] ?? []
    //     //         promisesByPage[normalizedPageUrl].push(promise)
    //     //     }
    //     //     annotationChunks.push(promise)
    //     // }

    //     const usersToLoad = new Set<UserReference['id']>()
    //     // for (const normalizedPageUrl in promisesByPage) {
    //     //     this.pageAnnotationPromises[normalizedPageUrl] = (async (
    //     //         normalizedPageUrl: string,
    //     //         pagePromises: Promise<GetAnnotationsResult>[],
    //     //     ) => {
    //             this.emitMutation({
    //                 annotationLoadStates: {
    //                     [normalizedPageUrls[0]]: { $set: 'running' },
    //                 },
    //             })

    //             try {
    //                 const annotationChunks = await Promise.all(pagePromises)
    //                 console.log('chunks', annotationChunks)
    //                 const newAnnotations: ReaderPageViewState['annotations'] = {}
    //                 for (const annotationChunk of annotationChunks) {
    //                     for (const [annotationId, annotation] of Object.entries(
    //                         annotationChunk,
    //                     )) {
    //                         newAnnotations[annotationId] = annotation
    //                     }
    //                 }

    //                 const toRender: RenderableAnnotation[] = []
    //                 for (const newAnnotation of Object.values(newAnnotations)) {
    //                     usersToLoad.add(newAnnotation.creator.id)
    //                     if (!newAnnotation.selector) {
    //                         continue
    //                     }
    //                 }

    //                 const nextState = this.emitAndApplyMutation(state, {
    //                     annotationLoadStates: {
    //                         [normalizedPageUrl]: { $set: 'success' },
    //                     },
    //                     annotations: mapValues(
    //                         newAnnotations,
    //                         (newAnnotation) => ({ $set: newAnnotation }),
    //                     ),
    //                     annotationEditStates: mapValues(
    //                         newAnnotations,
    //                         (newAnnotation) => ({
    //                             $set: {
    //                                 isEditing: false,
    //                                 loadState: 'pristine',
    //                                 comment: newAnnotation.comment ?? '',
    //                             },
    //                         }),
    //                     ) as any,
    //                     annotationHoverStates: mapValues(
    //                         newAnnotations,
    //                         (newAnnotation) => ({
    //                             $set: { isHovering: false },
    //                         }),
    //                     ),
    //                     annotationDeleteStates: mapValues(
    //                         newAnnotations,
    //                         (newAnnotation) => ({
    //                             $set: {
    //                                 isDeleting: false,
    //                                 deleteState: 'pristine' as UITaskState,
    //                             },
    //                         }),
    //                     ),
    //                     // Sort annot entries first by created time, then by highlight position in page (if highlight)
    //                     annotationEntryData: mapValues(
    //                         state.annotationEntryData,
    //                         (entries) => {
    //                             const annotationsByEntryLookup = new Map<
    //                                 AutoPk,
    //                                 SharedAnnotation
    //                             >()
    //                             for (const entry of entries) {
    //                                 annotationsByEntryLookup.set(
    //                                     entry.reference.id,
    //                                     newAnnotations[
    //                                         entry.sharedAnnotation.id.toString()
    //                                     ],
    //                                 )
    //                             }
    //                             const initEntriesSorter = (
    //                                 sortFn: AnnotationsSorter,
    //                             ) => (
    //                                 a: GetAnnotationListEntriesElement,
    //                                 b: GetAnnotationListEntriesElement,
    //                             ) =>
    //                                 sortFn(
    //                                     annotationsByEntryLookup.get(
    //                                         a.reference.id,
    //                                     )!,
    //                                     annotationsByEntryLookup.get(
    //                                         b.reference.id,
    //                                     )!,
    //                                 )

    //                             return {
    //                                 $set: entries
    //                                     .sort(
    //                                         initEntriesSorter(
    //                                             sortByCreatedTime,
    //                                         ),
    //                                     )
    //                                     .sort(
    //                                         initEntriesSorter(
    //                                             sortByPagePosition,
    //                                         ),
    //                                     ),
    //                             }
    //                         },
    //                     ),
    //                 })
    //                 await this.renderHighlightsInState(nextState)
    //             } catch (e) {
    //                 this.emitMutation({
    //                     annotationLoadStates: {
    //                         [normalizedPageUrl]: { $set: 'error' },
    //                     },
    //                 })
    //                 console.error(e)
    //             }
    //         })(normalizedPageUrl, promisesByPage[normalizedPageUrl])
    //     }

    private async renderHighlightsInState({
        annotations,
        isYoutubeVideo,
    }: ReaderPageViewState): Promise<void> {
        const toRender: RenderableAnnotation[] = []

        for (const { reference, selector, color } of Object.values(
            annotations,
        )) {
            if (!selector) {
                continue
            }

            try {
                const deserializedSelector = JSON.parse(selector)
                toRender.push({
                    id: reference.id,
                    selector: deserializedSelector,
                    color: color ? JSON.parse(color as string)[0] : undefined,
                })
            } catch (err) {
                // TODO: capture error
                console.warn(
                    'Could not parse selector for annotation: ',
                    reference.id,
                    selector,
                )
            }
        }

        // Youtube pages don't open the page inside an iframe, thus no need to wait for it
        if (!isYoutubeVideo) {
            await this.iframeSetupResolvable
        }
        if (toRender.length) {
            await this.highlightRenderer.renderHighlights(
                toRender,
                this.handleHighlightClick,
            )
        }
    }

    private handleHighlightClick: AnnotationClickHandler = async ({
        annotationId,
        openInEdit,
    }) => {
        if (!this.sidebarRef) {
            console.warn('Clicked on highlight but sidebar ref not yet setup')
            return
        }

        this.emitMutation({
            showSidebar: { $set: true },
        })

        const sidebarAnnotEl = this.sidebarRef.querySelector('#' + annotationId)
        if (!sidebarAnnotEl) {
            return
        }

        this.emitMutation({ activeAnnotationId: { $set: annotationId } })
        sidebarAnnotEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    clickAnnotationInSidebar: EventHandler<'clickAnnotationInSidebar'> = async ({
        event,
        previousState,
    }) => {
        this.emitMutation({
            activeAnnotationId: { $set: event.annotationId },
            showSidebar: { $set: false },
        })
        const annotationData = previousState.annotations[event.annotationId]

        if (this.highlightRenderer && annotationData?.selector) {
            await this.highlightRenderer.highlightAndScroll({
                id: event.annotationId,
                selector: JSON.parse(annotationData.selector),
            })
        }
    }

    setAnnotationCreating: EventHandler<'setAnnotationCreating'> = ({
        event,
    }) => {
        this.emitMutation({
            annotationCreateState: {
                isCreating: { $set: event.isCreating },
            },
        })
    }

    changeAnnotationCreateComment: EventHandler<'changeAnnotationCreateComment'> = ({
        event,
        previousState,
    }) => {
        this.emitMutation({
            annotationCreateState: {
                comment: { $set: event.comment },
            },
        })
    }

    cancelAnnotationCreate: EventHandler<'cancelAnnotationCreate'> = ({
        event,
    }) => {
        this.emitMutation({
            annotationCreateState: {
                isCreating: { $set: false },
            },
        })
    }

    confirmAnnotationCreate: EventHandler<'confirmAnnotationCreate'> = async ({
        event,
        previousState,
    }) => {
        if (!previousState.listData) {
            throw new Error(
                'Cannot create annotation before page URL is loaded',
            )
        }
        const comment = previousState.annotationCreateState.comment.trim()
        if (!comment.length) {
            this.emitMutation({
                annotationCreateState: {
                    isCreating: { $set: false },
                    comment: { $set: '' },
                },
            })
            return
        }
        const creator =
            this.dependencies.services.auth.getCurrentUserReference() ??
            undefined
        if (!creator) {
            throw new Error('Cannot create annotation if not logged in')
        }

        let sanitizedAnnotation

        if (comment && comment.length > 0) {
            sanitizedAnnotation = sanitizeHTMLhelper(comment?.trim())
        }

        let annotationCommentWithImages = sanitizedAnnotation
        if (sanitizedAnnotation) {
            annotationCommentWithImages = await processCommentForImageUpload(
                sanitizedAnnotation,
                null,
                null,
                this.dependencies.imageSupport,
                true,
            )
        }

        const createdWhen = Date.now()
        const {
            createPromise,
            annotationId,
        } = await this.scheduleAnnotationCreation({
            fullPageUrl: previousState.listData.entry.originalUrl,
            updatedWhen: createdWhen,
            createdWhen,
            comment: annotationCommentWithImages,
            creator,
        })

        this.emitMutation({
            annotationCreateState: {
                isCreating: { $set: false },
                comment: { $set: '' },
            },
        })

        await executeUITask(
            this,
            (loadState) => ({
                annotationCreateState: { loadState: { $set: loadState } },
            }),
            async () => {
                await createPromise
            },
        )
    }

    createYoutubeNote: EventHandler<'createYoutubeNote'> = async ({
        previousState,
    }) => {
        const currentUser =
            this.dependencies.services.auth.getCurrentUserReference() ??
            undefined
        if (!currentUser) {
            throw new Error('No user logged in')
        }

        const entry = previousState.listData?.entry!
        const youtubePlayer = this.dependencies.services.youtube.getPlayerByElementId(
            utils.getReaderYoutubePlayerId(entry.normalizedUrl),
        )
        const linkInfo = getVideoLinkInfo({ youtubePlayer: youtubePlayer })

        const newComment =
            previousState.annotationCreateState.comment +
            getAnnotationVideoLink(linkInfo) +
            ' '

        this.emitMutation({
            annotationCreateState: {
                comment: { $set: newComment },
                isCreating: {
                    $set: true,
                },
            },
        })
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

    localStorage.setItem('urlAndSpaceToOpen', payload.toString())
}
