import { ImageSupportInterface } from '@worldbrain/memex-common/lib/image-support/types'
import { UIElementServices } from '../../../services/types'
import { StorageModules } from '../../../storage/types'
import { Logic } from '../../../utils/logic'
import { executeTask, TaskState } from '../../../utils/tasks'
import StorageManager from '@worldbrain/storex'
import { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'
import { ReaderPageViewState } from '../../reader/ui/types'
import * as utils from '../utils/utils'
import { theme } from '../../../main-ui/styles/theme'
import { HighlightRenderer } from '@worldbrain/memex-common/lib/in-page-ui/highlighting/renderer'
import { PseudoSelection } from '@worldbrain/memex-common/lib/in-page-ui/types'
import html2canvas from 'html2canvas'
import { promptPdfScreenshot } from '@worldbrain/memex-common/lib/pdf/screenshots/selection'
import { doesUrlPointToPdf } from '@worldbrain/memex-common/lib/page-indexing/utils'
import { sleepPromise } from '../../../utils/promises'
import {
    IconKeys,
    MemexTheme,
} from '@worldbrain/memex-common/lib/common-ui/styles/types'
import { createResolvable } from '../../../utils/resolvable'
import { PdfScreenshotAnchor } from '@worldbrain/memex-common/lib/annotations/types'
import {
    RenderableAnnotation,
    SaveAndRenderHighlightDeps,
} from '@worldbrain/memex-common/lib/in-page-ui/highlighting/types'
import { normalizeUrl } from '@worldbrain/memex-url-utils/lib/normalize'
import { processCommentForImageUpload } from '@worldbrain/memex-common/lib/annotations/processCommentForImageUpload'
import {
    SharedAnnotation,
    SharedAnnotationReference,
    SharedListReference,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import sanitizeHTMLhelper from '@worldbrain/memex-common/lib/utils/sanitize-html-helper'
import { TOOLTIP_CONTAINER_ID } from '@worldbrain/memex-common/lib/in-page-ui/tooltip/constants'
import { GenerateServerID } from '@worldbrain/memex-common/lib/content-sharing/service/types'

const LIST_DESCRIPTION_CHAR_LIMIT = 400

export interface ReaderViewDependencies {
    services: UIElementServices<
        | 'auth'
        | 'bluesky'
        | 'overlay'
        | 'events'
        | 'listKeys'
        | 'contentSharing'
        | 'contentConversations'
        | 'activityStreams'
        | 'router'
        | 'activityStreams'
        | 'documentTitle'
        | 'userManagement'
        | 'localStorage'
        | 'clipboard'
        | 'userMessages'
        | 'youtube'
        | 'memexExtension'
        | 'summarization'
        | 'fullTextSearch'
    >
    storage: Pick<
        StorageModules,
        | 'contentSharing'
        | 'contentConversations'
        | 'users'
        | 'bluesky'
        | 'slack'
        | 'slackRetroSync'
        | 'discord'
        | 'discordRetroSync'
        | 'activityStreams'
        | 'activityFollows'
    >
    imageSupport: ImageSupportInterface
    getRootElement: () => HTMLElement
    storageManager: StorageManager
    generateServerId: GenerateServerID
    listId: string
    entryId: string
    sourceUrl: string
}

export type ReaderViewState = {
    annotations: SharedAnnotation[]
    loadState: TaskState
    preventInteractionsInIframe: boolean
    iframeLoadState: UITaskState
    isReaderInitialized: boolean
    showDropPDFNotice: boolean
    highlightCreateState: UITaskState
    role: 'owner' | 'viewer' | 'collaborator'
}

export class ReaderViewLogic extends Logic<ReaderViewState> {
    iframe: HTMLIFrameElement | null = null
    private highlightRenderer!: HighlightRenderer
    private iframeSetupResolvable = createResolvable()

    constructor(public props: ReaderViewDependencies) {
        super()
    }

    getInitialState = (): ReaderViewState => ({
        loadState: 'pristine',
        preventInteractionsInIframe: false,
        iframeLoadState: 'pristine',
        isReaderInitialized: false,
        showDropPDFNotice: false,
        highlightCreateState: 'pristine',
        role: 'viewer',
        annotations: [],
    })

    async initialize() {
        await executeTask(this, 'loadState', async () => {
            this.props.services.events.listen(async ({ annotationsLoaded }) => {
                // Handle the loaded annotations here
                console.log(
                    'Reader frame received annotations:',
                    annotationsLoaded,
                )
                this.setState({
                    annotations: annotationsLoaded,
                })
                await this.renderHighlightsInState({
                    annotations: annotationsLoaded,
                    isYoutubeVideo: false,
                })
                // Add your handling logic here
            })
        })
    }

    async initializeReader(containerEl: HTMLDivElement) {
        if (!this.state.isReaderInitialized) {
            this.setState({
                isReaderInitialized: true,
            })
        } else {
            return
        }

        const isPdf = doesUrlPointToPdf(this.props.sourceUrl!)
        // this.props.pdfBlob != null

        let pdfJsViewer
        await executeTask(this, 'loadState', async () => {
            if (isPdf) {
                this.iframe = utils.createIframeForPDFViewer()
            } else {
                const url = this.props.sourceUrl
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

                navigator.serviceWorker.addEventListener('message', (event) => {
                    if (event.data.msg_type === 'collAdded') {
                        // the replay is ready to be loaded when this message is received
                        initedResolve!()
                    }
                })

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

            /*@ts-ignore*/
            containerEl.ref.appendChild(this.iframe)
            await utils.waitForIframeLoad(this.iframe)

            if (isPdf) {
                const isLocalPDF =
                    this.props.sourceUrl != null &&
                    this.props.sourceUrl.includes('memex.cloud/ct/')
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
                    this.setState({
                        showDropPDFNotice: true,
                    })
                    // await utils.loadPDFInViewer(pdfJsViewer, null)
                } else {
                    await utils.loadPDFInViewer(
                        pdfJsViewer,
                        this.props.sourceUrl!,
                    )
                }
            }
            const anchors = this.iframe.querySelectorAll('a')
            anchors.forEach((anchor) => {
                anchor.setAttribute('target', '_blank')
            })
        })

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
                        {},
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

        // if (this.state.role === 'owner' || this.state.role === 'collaborator') {
        //     this.setupIframeTooltip(this.iframe, state)
        // }
        this.setState({
            iframeLoadState: 'success',
        })
        this.iframeSetupResolvable.resolve()
        return
    }

    createHighlightExec = async (
        selection?: PseudoSelection | undefined,
        shouldShare?: boolean,
        drawRectangle?: boolean | undefined,
        state?: ReaderPageViewState,
        iframe?: HTMLIFrameElement | null,
    ) => {
        if (state?.currentUserReference == null) {
            this.props.services.auth.requestAuth({
                reason: 'login-requested',
            })
            return
        }

        await executeTask(this, 'highlightCreateState', async () => {
            let pdfViewer

            const isIframe = iframe!.contentWindow

            if (isIframe) {
                pdfViewer = (isIframe as any)['PDFViewerApplication']?.pdfViewer
            }

            let result
            if (pdfViewer && drawRectangle) {
                const screenshotGrabResult = await promptPdfScreenshot(
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
                            imageSupport: this.props.imageSupport,
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
                    imageSupport: this.props.imageSupport,
                    state,
                }),
            )
            await result.createPromise
        })
    }

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

    private getRenderHighlightParams = (args: {
        selection?: PseudoSelection | null
        shouldShare?: boolean | null
        openInEditMode?: boolean | null
        screenShotAnchor?: PdfScreenshotAnchor | undefined
        screenShotImage?: HTMLCanvasElement | undefined
        imageSupport?: ImageSupportInterface
        state?: ReaderPageViewState
    }): SaveAndRenderHighlightDeps => {
        const currentUser =
            this.props.services.auth.getCurrentUserReference() ?? undefined
        if (!currentUser) {
            throw new Error('No user logged in')
        }

        return {
            currentUser,
            isPdf: doesUrlPointToPdf(args.state?.sourceUrl!),
            shouldShare: args.shouldShare ?? undefined,
            openInEditMode: args.openInEditMode ?? undefined,
            onClick: (params) =>
                this.handleHighlightClick({
                    annotationId: params.annotationId,
                    openInEdit: params.openInEdit,
                }),
            getSelection: args.selection ?? null,
            getFullPageUrl: async () =>
                args.state?.listData?.entry.originalUrl!,
            screenshotAnchor: args.screenShotAnchor,
            screenshotImage: args.screenShotImage,
            imageSupport: args.imageSupport,
            highlightColorSettings: [],
        }
    }

    scheduleAnnotationCreation = async (annotationData, openInEditMode) => {
        const normalizedPageUrl = normalizeUrl(annotationData.fullPageUrl, {})
        const creator = this.props.services.auth.getCurrentUserReference()
        if (!creator) {
            throw new Error('No user logged in')
        }
        const annotationId = this.props.generateServerId('sharedAnnotation')
        const annotationRef: SharedAnnotationReference = {
            type: 'shared-annotation-reference',
            id: annotationId,
        }
        const listRef: SharedListReference = {
            type: 'shared-list-reference',
            id: this.props.listId,
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
                this.props.imageSupport,
                false,
            )
        }

        // Update UI state (TODO: Why are the types messed up enough that I need to `as any` here?)
        this.setState({
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
        })

        // Schedule DB entry creation
        const createPromise = this.props.storage.contentSharing
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
                        id: this.props.listId,
                    },
                ],
            })
            .then(({ sharedAnnotationListEntryReferences }) => {
                // const ref =
                //     sharedAnnotationListEntryReferences[
                //         annotationId.toString()
                //     ]?.[0]
                // if (!ref) {
                //     return
                // }
                // // Update newly created annotationEntryData entry with ID
                // this.setState({
                //     annotationEntryData: {
                //         [normalizedPageUrl]: {
                //             $apply: (
                //                 previousState?: GetAnnotationListEntriesElement[],
                //             ) => {
                //                 const dummyEntryIdx = previousState?.findIndex(
                //                     (el) => el.reference.id === annotationId,
                //                 )
                //                 if (
                //                     !previousState ||
                //                     !dummyEntryIdx ||
                //                     dummyEntryIdx === -1
                //                 ) {
                //                     return previousState
                //                 }
                //                 previousState[dummyEntryIdx] = {
                //                     ...previousState[dummyEntryIdx],
                //                     reference: ref,
                //                 }
                //                 return previousState
                //             },
                //         },
                //     } as any,
                // })
            })

        return {
            annotationId,
            createPromise,
        }
    }

    handleHighlightClick = async ({
        annotationId,
        openInEdit,
    }: {
        annotationId: string
        openInEdit: boolean
    }) => {
        console.log('handleHighlightClick', annotationId, openInEdit)
    }

    setupIframeTooltip(
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

        // ReactDOM.render(
        //     <StyleSheetManager target={shadowRoot as any}>
        //         <ThemeProviderComponent theme={fixedTheme}>
        //             <Tooltip
        //                 getRootElement={() =>
        //                     iframe.contentDocument
        //                         ?.getElementById(TOOLTIP_CONTAINER_ID)
        //                         ?.shadowRoot?.getElementById(
        //                             TOOLTIP_HOST_ID,
        //                         ) as HTMLElement
        //                 }
        //                 hideAddToSpaceBtn
        //                 tooltip={{
        //                     getState: async () => {
        //                         return true
        //                     },
        //                     setState: async (state) => {
        //                         console.log('setState', state)
        //                     },
        //                 }}
        //                 getWindow={() => iframe.contentWindow!}
        //                 createHighlight={async (
        //                     selection,
        //                     shouldShare,
        //                     drawRectangle,
        //                 ) => {
        //                     {
        //                         if (this.createHighlightExec && selection) {
        //                             await this.createHighlightExec(
        //                                 selection,
        //                                 shouldShare ?? false,
        //                                 drawRectangle as boolean,
        //                                 state,
        //                                 iframe,
        //                             )
        //                         }
        //                     }
        //                     return null
        //                 }}
        //                 createAnnotation={async (selection, shouldShare) => {
        //                     if (state.currentUserReference == null) {
        //                         this.dependencies.services.auth.requestAuth({
        //                             reason: 'login-requested',
        //                         })
        //                         return
        //                     } else {
        //                         await this.highlightRenderer.saveAndRenderHighlight(
        //                             this.getRenderHighlightParams({
        //                                 selection,
        //                                 shouldShare,
        //                                 openInEditMode: true,
        //                                 screenShotAnchor: undefined,
        //                                 screenShotImage: undefined,
        //                                 imageSupport: this.dependencies
        //                                     .imageSupport,
        //                                 state,
        //                             }),
        //                         )
        //                     }
        //                 }}
        //                 onTooltipInit={(showTooltip) => {
        //                     showTooltipCb = showTooltip
        //                 }}
        //                 context={'reader'}
        //                 shouldInitTooltip={true}
        //                 openImageInPreview={async (imageSource) => {
        //                     this.processUIEvent('openImageInPreview', {
        //                         event: {
        //                             imageSource,
        //                         },
        //                         // @ts-ignore
        //                         previousState: null,
        //                     })
        //                 }}
        //             />
        //         </ThemeProvider>
        //     </StyleSheetManager>,
        //     reactContainer,
        // )
    }
}
