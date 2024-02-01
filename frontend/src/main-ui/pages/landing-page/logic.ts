import { UIEventHandler } from 'ui-logic-core'
import { UILogic, UIMutation, executeUITask } from '../../classes/logic'
import type {
    LandingPageEvent,
    LandingPageState,
    LandingPageDependencies,
} from './types'
import * as PDFJS from 'pdfjs-dist'
import type { TypedArray } from 'pdfjs-dist/types/display/api'
import { RETRIEVE_PDF_ROUTE } from '@worldbrain/memex-common/lib/pdf/uploads/constants'
import { CLOUDFLARE_WORKER_URLS } from '@worldbrain/memex-common/lib/content-sharing/storage/constants'
import { extractDataFromPDFDocument } from '@worldbrain/memex-common/lib/page-indexing/content-extraction/extract-pdf-content'
import { determineEnv } from '../../../utils/runtime-environment'
import { AutoPk } from '@worldbrain/memex-common/lib/storage/types'

type EventHandler<EventName extends keyof LandingPageEvent> = UIEventHandler<
    LandingPageState,
    LandingPageEvent,
    EventName
>

export default class LandingPageLogic extends UILogic<
    LandingPageState,
    LandingPageEvent
> {
    constructor(private dependencies: LandingPageDependencies) {
        super()
    }

    setFileAreaHoverState: EventHandler<'setFileAreaHoverState'> = async (
        incoming,
    ) => {
        console.log(
            'switching to bookmarklet text',
            incoming.event.fileAreaHoverState,
        )
        this.emitMutation({
            fileAreaHoverState: { $set: incoming.event.fileAreaHoverState },
        })
    }

    switchToBookmarkletText: EventHandler<'switchToBookmarkletText'> = async (
        incoming,
    ) => {
        console.log('switching to bookmarklet text', incoming.event)
        this.emitMutation({
            showBookmarkletText: { $set: incoming.event },
        })
    }
    switchToExtensionDownloadText: EventHandler<'switchToExtensionDownloadText'> = async (
        incoming,
    ) => {
        console.log('switching to extension text', incoming.event)
        this.emitMutation({
            showExtensionDownloadText: { $set: incoming.event },
        })
    }
    newUrlInputChanged: EventHandler<'newUrlInputChanged'> = async (
        incoming,
    ) => {
        let isValidUrl = false
        console.log('test')
        try {
            const url = new URL(incoming.event.newUrlInputValue)
            console.log('url', url)
            if (url.protocol === 'http:' || url.protocol === 'https:') {
                console.log('ur', url.protocol)
                isValidUrl = true
            }
        } catch (error) {
            isValidUrl = false
        }
        this.emitMutation({
            isValidUrl: { $set: isValidUrl },
        })

        this.emitMutation({
            newUrlInputValue: { $set: incoming.event.newUrlInputValue },
        })
    }
    setFileDragState: EventHandler<'setFileDragState'> = async (incoming) => {
        this.emitMutation({
            fileDragState: { $set: incoming.event.fileDragState },
        })
    }
    handlePDFBlob: EventHandler<'handlePDFBlob'> = async (incoming) => {
        if (
            !(incoming.event.file instanceof Blob) ||
            incoming.event.file.type !== 'application/pdf'
        ) {
            return // Ignore any unexpected messages
        }

        await this.createAndRouteToPageLinkForBlob(incoming.event.file)
    }

    getInitialState(): LandingPageState {
        return {
            newUrlInputValue: '',
            linkCreationState: 'pristine',
            fileDragState: false,
            linkProcessingState: 'pristine',
            isValidUrl: false,
            showBookmarkletText: false,
            showExtensionDownloadText: false,
        }
    }

    handleURLtoProcess: EventHandler<'handleURLtoProcess'> = async (
        incoming,
    ) => {
        const url = incoming.event.url

        try {
            new URL(url)
            // If the URL is valid, proceed with creating and routing to page link for the remote URL
            await this.createAndRouteToPageLinkForRemoteUrl(url)
        } catch (error) {
            console.error(`Invalid URL: ${url}`)
            // Handle invalid URL case here, e.g., by setting an error state or notifying the user
            this.emitMutation({
                linkProcessingState: { $set: 'error' },
            })
            return
        }

        this.emitMutation({
            linkProcessingState: { $set: 'pristine' },
        })

        await this.createAndRouteToPageLinkForRemoteUrl(url)
    }

    async createAndRouteToPageLinkForRemoteUrl(fullPageUrl: string) {
        const { services } = this.dependencies

        await executeUITask(this, 'linkCreationState', async () => {
            if (!fullPageUrl) {
                throw new Error(
                    `'url' query string parameter must be set to create a page link`,
                )
            }

            // Validate input URL
            try {
                new URL(fullPageUrl)
            } catch (err) {
                throw new Error(`Given URL is not valid: ${fullPageUrl}`)
            }

            const {
                remoteListId,
                remoteListEntryId,
            } = await services.pageLinks.createPageLink({
                fullPageUrl,
            })

            this.routeToPageLink(remoteListId, remoteListEntryId)
        })
    }

    async createAndRouteToPageLinkForBlob(content: Blob) {
        const { services, generateServerId } = this.dependencies

        const authEnforced = await this.dependencies.services.auth.enforceAuth({
            reason: 'registration-requested',
        })
        if (!authEnforced) {
            await this.dependencies.services.auth.waitForAuth()
        }

        // if (this.dependencies.fullPageUrl == null) {
        //     // Send message to memex.garden saying we're ready to receive files
        //     this.sendReadyMessage()
        // }

        await executeUITask(this, 'linkCreationState', async () => {
            // Extract PDF data from Blob via PDFjs
            const arrayBuffer = await content.arrayBuffer()
            PDFJS.GlobalWorkerOptions.workerSrc = 'build/pdf.worker.min.js'
            const pdf = await PDFJS.getDocument(arrayBuffer as TypedArray)
                .promise
            const pdfData = await extractDataFromPDFDocument(pdf)

            this.emitMutation({ linkCreationState: { $set: 'running' } })

            const uploadId = generateServerId('uploadAuditLogEntry').toString()
            const uploadTokenResult = await services.pdfUploadService.getUploadToken(
                {
                    uploadId,
                },
            )
            if (uploadTokenResult.error != null) {
                throw new Error(
                    `Could not get PDF upload token - reason: ${uploadTokenResult.error}`,
                )
            }

            const token = uploadTokenResult.token
            const cfWorkerUrl =
                determineEnv() === 'production'
                    ? CLOUDFLARE_WORKER_URLS.production
                    : CLOUDFLARE_WORKER_URLS.staging
            const tempPDFAccessLink =
                cfWorkerUrl + RETRIEVE_PDF_ROUTE + '?token=' + token

            // Start PDF upload but don't wait for it
            const pdfUploadPromise = services.pdfUploadService.uploadPdfContent(
                { token, content },
            )

            const {
                remoteListId,
                remoteListEntryId,
            } = await services.pageLinks.createPageLink({
                fullPageUrl: tempPDFAccessLink,
                uploadedPdfParams: {
                    uploadId,
                    title: pdfData.title,
                    fingerprints: pdfData.pdfMetadata.fingerprints,
                },
            })

            this.routeToPageLink(remoteListId, remoteListEntryId, content)

            // TODO: handle bad PDF upload result
            const uploadResult = await pdfUploadPromise
        })
    }

    private routeToPageLink(
        listId: AutoPk,
        listEntryId: AutoPk,
        pdfBlob?: Blob,
    ): void {
        const pageLinkCreationCounter = JSON.parse(
            localStorage.getItem('pageLinkCreationCounter') || '[]',
        )
        pageLinkCreationCounter.push(Date.now())
        localStorage.setItem(
            'pageLinkCreationCounter',
            JSON.stringify(pageLinkCreationCounter),
        )

        this.emitMutation({ linkCreationState: { $set: 'success' } })

        this.dependencies.services.router.goTo(
            'pageView',
            {
                id: listId.toString(),
                entryId: listEntryId.toString(),
            },
            {
                query: { noAutoOpen: 'true' },
                state: { pdfBlob },
            },
        )
    }
}
