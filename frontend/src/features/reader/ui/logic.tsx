import React from 'react'
import ReactDOM from 'react-dom'
import { ThemeProvider, StyleSheetManager } from 'styled-components'
import createResolvable from '@josephg/resolvable'
import Tooltip from '@worldbrain/memex-common/lib/in-page-ui/tooltip/container'
import { conditionallyTriggerTooltip } from '@worldbrain/memex-common/lib/in-page-ui/tooltip/utils'
import { theme } from '../../../../src/main-ui/styles/theme'
import {
    GetAnnotationsResult,
    GetAnnotationListEntriesResult,
    SharedCollectionType,
} from '@worldbrain/memex-common/lib/content-sharing/storage/types'
import { GetAnnotationListEntriesElement } from '@worldbrain/memex-common/lib/content-sharing/storage/types'
import {
    SharedAnnotationReference,
    SharedListReference,
    SharedListRoleID,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import { makeStorageReference } from '@worldbrain/memex-common/lib/storage/references'
import { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import {
    HighlightRenderer,
    Dependencies as HighlightRendererDeps,
} from '@worldbrain/memex-common/lib/in-page-ui/highlighting/renderer'
import { mapValues } from 'lodash'
import chunk from 'lodash/chunk'
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
import { fetchWebsiteHTML } from '../utils/api'
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
import type { MemexTheme } from '@worldbrain/memex-common/lib/common-ui/styles/types'
import type { UploadStorageUtils } from '@worldbrain/memex-common/lib/personal-cloud/backend/translation-layer/storage-utils'
import { createPersonalCloudStorageUtils } from '@worldbrain/memex-common/lib/content-sharing/storage/utils'
import { userChanges } from '../../../services/auth/utils'
import type { PersonalAnnotation } from '@worldbrain/memex-common/lib/web-interface/types/storex-generated/personal-cloud'
import type { AutoPk } from '../../../types'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'
import { doesMemexExtDetectionElExist } from '@worldbrain/memex-common/lib/common-ui/utils/content-script'
import { doesUrlPointToPdf } from '@worldbrain/memex-common/lib/page-indexing/utils'
import { determineEnv } from '../../../utils/runtime-environment'
import { CLOUDFLARE_WORKER_URLS } from '@worldbrain/memex-common/lib/content-sharing/storage/constants'

type EventHandler<EventName extends keyof ReaderPageViewEvent> = UIEventHandler<
    ReaderPageViewState,
    ReaderPageViewEvent,
    EventName
>

export class ReaderPageViewLogic extends UILogic<
    ReaderPageViewState,
    ReaderPageViewEvent
> {
    private users: UserProfileCache
    private isReaderInitialized = false
    private iframeLoaded = false
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
    private cleanupIframeTooltipShowListener?: () => void
    private listCreator = createResolvable<UserReference>()

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
            originalUrl: null,
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
            currentUserReference: null,
            annotationEditStates: {},
            annotationHoverStates: {},
            annotationLoadStates: {},
            annotationEntryData: {},
            annotations: {},
            users: {},
            sidebarWidth: 400,
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
            ...annotationConversationInitialState(),
        }
    }

    init: EventHandler<'init'> = async ({ previousState }) => {
        const { contentSharing } = this.dependencies.storage
        const { auth, router, listKeys } = this.dependencies.services
        const listReference = makeStorageReference<SharedListReference>(
            'shared-list-reference',
            this.dependencies.listID,
        )

        const joinListPromise = executeUITask<ReaderPageViewState>(
            this,
            'joinListState',
            async () => {
                const keyString = router.getQueryParam('key')
                if (!keyString?.length) {
                    return
                }

                await auth.waitForAuth()
                const { result } = await listKeys.processCurrentKey({
                    type: SharedCollectionType.PageLink,
                })
                this.emitMutation({ joinListResult: { $set: result } })
            },
        )

        const loadListPromise = executeUITask<ReaderPageViewState>(
            this,
            'listLoadState',
            async () => {
                const baseUrl =
                    determineEnv() === 'production'
                        ? 'https://memex.social/c/'
                        : 'https://staging.memex.social/c/'

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

                const isMemexInstalled = doesMemexExtDetectionElExist()

                if (isMemexInstalled) {
                    await this.dependencies.services?.memexExtension.openLink({
                        originalPageUrl: listEntry.originalUrl,
                        sharedListId: listReference?.id as string,
                    })
                }

                this.emitMutation({
                    annotationLoadStates: {
                        [normalizedPageUrl]: { $set: 'running' },
                    },
                })

                this.emitMutation({
                    originalUrl: { $set: listEntry.originalUrl },
                    isYoutubeVideo: {
                        $set: normalizedPageUrl.startsWith('youtube.com/'),
                    },
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

                document.title = result.entries[0].entryTitle
                    ? result.entries[0].entryTitle
                    : ''

                this.listCreator.resolve(result.creator)

                const annotationEntriesByList = await contentSharing.getAnnotationListEntriesForListsOnPage(
                    {
                        listReferences: [listReference],
                        normalizedPageUrl,
                    },
                )

                const entries = annotationEntriesByList[listReference.id] ?? []
                if (!entries.length) {
                    this.emitMutation({
                        annotationLoadStates: {
                            [normalizedPageUrl]: { $set: 'success' },
                        },
                    })

                    return
                }

                this.emitMutation({
                    annotationEntryData: {
                        $set: { [listEntry.normalizedUrl]: entries },
                    },
                })

                const isYoutube = normalizedPageUrl.startsWith('youtube.com/')

                const intervalId = setInterval(() => {
                    if (this.iframeLoaded && !isYoutube) {
                        clearInterval(intervalId)
                        this.loadPageAnnotations(
                            { [normalizedPageUrl]: entries },
                            [normalizedPageUrl],
                            previousState,
                        )
                    }
                }, 100)

                if (isYoutube) {
                    this.loadPageAnnotations(
                        { [normalizedPageUrl]: entries },
                        [normalizedPageUrl],
                        previousState,
                    )
                }
            },
        )

        await Promise.all([
            this.loadPermissions(),
            loadListPromise,
            joinListPromise,
        ])
    }

    cleanup: EventHandler<'cleanup'> = async () => {
        this.cleanupIframeTooltipShowListener?.()
    }

    private async listenToUserChanges() {
        setTimeout(async () => {
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
        }, 1000)
    }

    private async loadPermissions(): Promise<void> {
        const { contentSharing } = this.dependencies.storage
        const { auth, router } = this.dependencies.services
        const listReference = makeStorageReference<SharedListReference>(
            'shared-list-reference',
            this.dependencies.listID,
        )
        await executeUITask<ReaderPageViewState>(
            this,
            'permissionsLoadState',
            async () => {
                await auth.waitForAuthReady()
                const userReference = auth.getCurrentUserReference()

                this.emitMutation({
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
                    this.emitMutation({
                        collaborationKey: { $set: keyString },
                        permissions: { $set: 'contributor' },
                    })
                }

                // Ensure the current user has a role in this list elevated enough to share collaboration keys
                const listRoles = await contentSharing.getUserListRolesForList({
                    userReference,
                    listReference,
                })

                let currentRoleID = listRoles.find(
                    (role) =>
                        role.sharedList.id.toString() ===
                        this.dependencies.listID,
                )?.roleID

                if (!currentRoleID) {
                    const creator = await this.listCreator
                    if (creator.id === userReference.id) {
                        currentRoleID = SharedListRoleID.Owner
                    }
                }
                if (!currentRoleID) {
                    return
                }

                const isOwner = currentRoleID === SharedListRoleID.Owner
                this.emitMutation({
                    permissions: { $set: isOwner ? 'owner' : 'contributor' },
                })

                if (!isOwner) {
                    return // Only the owner has permission to lookup the key
                }

                const collaborationKeys = await contentSharing.getListKeys({
                    listReference,
                })

                const collaborationKey = collaborationKeys.find(
                    (key) => key.roleID >= SharedListRoleID.ReadWrite,
                )
                if (!collaborationKey) {
                    return
                }

                this.emitMutation({
                    collaborationKey: {
                        $set: collaborationKey.reference.id.toString(),
                    },
                })
            },
        )
    }

    setReaderContainerRef: EventHandler<'setReaderContainerRef'> = async ({
        event,
        previousState,
    }) => {
        if (event.ref) {
            const { entry } = previousState.listData ?? {}
            if (entry) {
                await this.initializeReader(
                    event.ref,
                    entry.originalUrl,
                    previousState,
                )
            }
        }
    }

    private async initializeReader(
        containerEl: HTMLDivElement,
        originalUrl: string,
        state: ReaderPageViewState,
    ) {
        if (!this.isReaderInitialized) {
            this.isReaderInitialized = true
        } else {
            return
        }

        const isPdf = doesUrlPointToPdf(originalUrl)
        let iframe: HTMLIFrameElement | null = null
        await executeUITask<ReaderPageViewState>(
            this,
            'iframeLoadState',
            async () => {
                if (isPdf) {
                    iframe = utils.createIframeForPDFViewer()
                } else {
                    const html = await fetchWebsiteHTML(originalUrl)
                    const fixedHtml = await utils.convertRelativeUrlsToAbsolute(
                        html,
                        originalUrl,
                    )
                    iframe = await utils.createIframeForHtml(fixedHtml)
                }
                containerEl.appendChild(iframe)
                await utils.waitForIframeLoad(iframe)

                if (isPdf) {
                    // Get PDFViewer from now-loaded iframe
                    const pdfJsViewer = (iframe.contentWindow as any)[
                        'PDFViewerApplication'
                    ]
                    if (!pdfJsViewer) {
                        throw new Error(
                            'PDF.js viewer script did not load inside iframe',
                        )
                    }
                    await utils.loadPDFInViewer(pdfJsViewer, originalUrl)
                }
            },
        )

        if (!iframe) {
            return
        }
        this.iframeLoaded = true

        const normalizedPageUrl = normalizeUrl(originalUrl)

        const entries = state.annotationEntryData?.[normalizedPageUrl]

        // await this.loadPageAnnotations({ entries }, [normalizedPageUrl], state)

        this.highlightRenderer = new HighlightRenderer({
            getWindow: () => iframe!.contentWindow,
            getDocument: () => iframe!.contentDocument,
            scheduleAnnotationCreation: this.scheduleAnnotationCreation,
        })
        if (state.permissions != null) {
            this.setupIframeTooltip(iframe, originalUrl)
        }
        await this.renderHighlightsInState(state)
    }

    private setupIframeTooltip(
        iframe: HTMLIFrameElement,
        originalUrl: string,
    ): void {
        const shadowRootContainer = document.createElement('div')
        shadowRootContainer.id = 'memex-tooltip-container' // NOTE: this needs to be here else tooltip won't auto-hide on click away (see <ClickAway> comp)
        iframe.contentDocument?.body.appendChild(shadowRootContainer)
        const shadowRoot = shadowRootContainer?.attachShadow({ mode: 'open' })
        let showTooltipCb = () => {}

        if (!shadowRoot) {
            throw new Error('Shadow DOM could not be attached to iframe')
        }

        // Create a div for the React rendering of the tooltip component (inside the shadow DOM)
        const reactContainer = document.createElement('div')
        shadowRoot.appendChild(reactContainer)

        const getRenderHighlightParams = (args: {
            selection: Selection
            shouldShare?: boolean
            openInEditMode?: boolean
        }): SaveAndRenderHighlightDeps => {
            const currentUser =
                this.dependencies.services.auth.getCurrentUserReference() ??
                undefined
            if (!currentUser) {
                throw new Error('No user logged in')
            }

            return {
                currentUser,
                isPdf: doesUrlPointToPdf(originalUrl),
                shouldShare: args.shouldShare,
                openInEditMode: args.openInEditMode,
                onClick: this.handleHighlightClick,
                getSelection: () => args.selection,
                getFullPageUrl: async () => originalUrl,
            }
        }
        const fixedTheme: MemexTheme = {
            ...theme,
            icons: { ...theme.icons },
        }

        // Image blob URLs need to have the origin prefixed
        for (const [key, value] of Object.entries(fixedTheme.icons)) {
            // Let data URLs be - they don't need origin prefixing
            if (value.startsWith('data:')) {
                continue
            }
            fixedTheme.icons[key as keyof MemexTheme['icons']] =
                window.origin + value
        }

        ReactDOM.render(
            <StyleSheetManager target={shadowRoot as any}>
                <ThemeProvider theme={fixedTheme}>
                    <Tooltip
                        hideAddToSpaceBtn
                        getWindow={() => iframe.contentWindow!}
                        createHighlight={async (selection, shouldShare) => {
                            await this.highlightRenderer.saveAndRenderHighlight(
                                getRenderHighlightParams({
                                    selection,
                                    shouldShare,
                                }),
                            )
                        }}
                        createAnnotation={async (selection, shouldShare) => {
                            await this.highlightRenderer.saveAndRenderHighlight(
                                getRenderHighlightParams({
                                    selection,
                                    shouldShare,
                                    openInEditMode: true,
                                }),
                            )
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

        const showTooltipListener = async (event: MouseEvent) => {
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

        this.cleanupIframeTooltipShowListener = () => {
            iframe.contentDocument?.body.removeEventListener(
                'mouseup',
                showTooltipListener,
            )
        }
    }

    private scheduleAnnotationCreation: HighlightRendererDeps['scheduleAnnotationCreation'] = (
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

        // Update UI state (TODO: Why are the types messed up enough that I need to `as any` here?)
        this.emitMutation({
            annotationEditStates: {
                [annotationId]: {
                    $set: {
                        isEditing: !!openInEditMode,
                        comment: annotationData.comment ?? '',
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
            } as any,
            annotations: {
                [annotationId]: {
                    $set: {
                        creator,
                        normalizedPageUrl,
                        linkId: annotationId,
                        reference: annotationRef,
                        body: annotationData.body,
                        comment: annotationData.comment,
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
                        ...(previousState ?? []),
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
                            comment: annotationData.comment,
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
    showSharePageMenu: EventHandler<'showSharePageMenu'> = async (incoming) => {
        this.emitMutation({
            showShareMenu: { $set: !incoming.previousState.showShareMenu },
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

    private async loadPageAnnotations(
        annotationEntries: GetAnnotationListEntriesResult,
        normalizedPageUrls: string[],
        state: ReaderPageViewState,
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

                    const toRender: RenderableAnnotation[] = []
                    for (const newAnnotation of Object.values(newAnnotations)) {
                        usersToLoad.add(newAnnotation.creator.id)
                        if (!newAnnotation.selector) {
                            continue
                        }
                    }

                    const mutation: UIMutation<ReaderPageViewState> = {
                        annotationLoadStates: {
                            [normalizedPageUrl]: { $set: 'success' },
                        },
                        annotations: mapValues(
                            newAnnotations,
                            (newAnnotation) => ({ $set: newAnnotation }),
                        ),
                        annotationEditStates: mapValues(
                            newAnnotations,
                            (newAnnotation) => ({
                                $set: {
                                    isEditing: false,
                                    loadState: 'pristine',
                                    comment: newAnnotation.comment ?? '',
                                },
                            }),
                        ) as any,
                        annotationHoverStates: mapValues(
                            newAnnotations,
                            (newAnnotation) => ({
                                $set: {
                                    isHovering: false,
                                },
                            }),
                        ),
                    }
                    const nextState = this.withMutation(state, mutation)
                    this.emitMutation(mutation)
                    await this.renderHighlightsInState(nextState)
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

    private async renderHighlightsInState({
        annotations,
    }: ReaderPageViewState): Promise<void> {
        const toRender: RenderableAnnotation[] = []

        for (const { reference, selector } of Object.values(annotations)) {
            if (!selector) {
                continue
            }

            try {
                const deserializedSelector = JSON.parse(selector)
                toRender.push({
                    id: reference.id,
                    selector: deserializedSelector,
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

        if (this.highlightRenderer && toRender.length) {
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
            showSidebar: { $set: false },
        })

        this.emitMutation({ activeAnnotationId: { $set: event.annotationId } })
        const annotationData = previousState.annotations[event.annotationId]

        if (this.highlightRenderer && annotationData?.selector) {
            await this.highlightRenderer.highlightAndScroll({
                id: event.annotationId,
                selector: JSON.parse(annotationData.selector),
            })
        }
    }

    setAnnotationEditing: EventHandler<'setAnnotationEditing'> = ({
        event,
    }) => {
        this.emitMutation({
            annotationEditStates: {
                [event.annotationId]: { isEditing: { $set: event.isEditing } },
            },
        })
    }
    setAnnotationHovering: EventHandler<'setAnnotationHovering'> = ({
        event,
    }) => {
        this.emitMutation({
            annotationHoverStates: {
                [event.annotationId]: {
                    isHovering: { $set: event.isHovering },
                },
            },
        })
    }

    changeAnnotationEditComment: EventHandler<'changeAnnotationEditComment'> = ({
        event,
    }) => {
        this.emitMutation({
            annotationEditStates: {
                [event.annotationId]: { comment: { $set: event.comment } },
            },
        })
    }

    cancelAnnotationEdit: EventHandler<'cancelAnnotationEdit'> = ({
        event,
    }) => {
        this.emitMutation({
            annotationEditStates: {
                [event.annotationId]: { isEditing: { $set: false } },
            },
        })
    }

    confirmAnnotationEdit: EventHandler<'confirmAnnotationEdit'> = async ({
        event,
        previousState,
    }) => {
        const annotation = previousState.annotations[event.annotationId]
        const editState = previousState.annotationEditStates[event.annotationId]
        if (!editState) {
            throw new Error(
                'Attempted annotation edit for non-existent annotation',
            )
        }
        if (!this.personalCloudStorageUtils) {
            throw new Error(
                'Attempted annotation edit without personal cloud storage utils being setup',
            )
        }

        this.emitMutation({
            annotations: {
                [event.annotationId]: { comment: { $set: editState.comment } },
            },
            annotationEditStates: {
                [event.annotationId]: { isEditing: { $set: false } },
            },
        })

        await executeUITask(
            this,
            (loadState) => ({
                annotationEditStates: {
                    [event.annotationId]: { loadState: { $set: loadState } },
                },
            }),
            async () => {
                // Skip storage ops early if no change
                if (annotation.comment === editState.comment) {
                    return
                }

                await this.dependencies.storage.contentSharing.updateAnnotationComment(
                    {
                        updatedComment: editState.comment,
                        sharedAnnotationReference: {
                            type: 'shared-annotation-reference',
                            id: event.annotationId,
                        },
                    },
                )

                // Update personal cloud DB to trigger sync changes
                // TODO: Probably move this to a `onUpdate` storage hook (when supported) rather than manually doing here
                const personalAnnotation = await this.personalCloudStorageUtils!.findOne<
                    PersonalAnnotation & { id: AutoPk }
                >('personalAnnotation', {
                    localId: annotation.createdWhen.toString(),
                })
                await this.personalCloudStorageUtils!.updateById(
                    'personalAnnotation',
                    personalAnnotation.id,
                    {
                        comment: editState.comment,
                    },
                )
            },
        )
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
                isCreating: {
                    $set:
                        event.comment.trim().length > 0
                            ? true
                            : previousState.annotationCreateState.isCreating,
                },
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
        if (!previousState.originalUrl) {
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

        const createdWhen = Date.now()
        const { createPromise } = this.scheduleAnnotationCreation({
            fullPageUrl: previousState.originalUrl!,
            updatedWhen: createdWhen,
            createdWhen,
            comment,
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
        this.scheduleAnnotationCreation(
            {
                createdWhen: Date.now(),
                updatedWhen: Date.now(),
                fullPageUrl: entry.originalUrl,
                body: null!,
                selector: null!,
                comment: getAnnotationVideoLink(linkInfo) + ' ',
            },
            true,
        )
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
