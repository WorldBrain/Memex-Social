import type { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'
import {
    UILogic,
    UIEventHandler,
    executeUITask,
    loadInitial,
} from '../../../../../main-ui/classes/logic'
import type {
    PageLinkCreationPageDependencies,
    PageLinkCreationPageEvent,
} from './types'
import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'
import { CLOUDFLARE_WORKER_URLS } from '@worldbrain/memex-common/lib/content-sharing/storage/constants'
import { RETRIEVE_PDF_ROUTE } from '@worldbrain/memex-common/lib/pdf/uploads/constants'
import * as PDFJS from 'pdfjs-dist'
import type { TypedArray } from 'pdfjs-dist/types/display/api'
import { extractDataFromPDFDocument } from '@worldbrain/memex-common/lib/page-indexing/content-extraction/extract-pdf-content'
import { determineEnv } from '../../../../../utils/runtime-environment'

export interface PageLinkCreationState {
    needsAuth: boolean
    loadState: UITaskState
    linkCreationState: UITaskState
}

type EventHandler<
    EventName extends keyof PageLinkCreationPageEvent
> = UIEventHandler<PageLinkCreationState, PageLinkCreationPageEvent, EventName>

export default class PageLinkCreationLogic extends UILogic<
    PageLinkCreationState,
    PageLinkCreationPageEvent
> {
    constructor(
        private dependencies: PageLinkCreationPageDependencies & {
            windowObj: Pick<Window, 'addEventListener' | 'removeEventListener'>
        },
    ) {
        super()
    }

    getInitialState(): PageLinkCreationState {
        return {
            needsAuth: false,
            loadState: 'pristine',
            linkCreationState: 'pristine',
        }
    }

    private handleWindowMessage = ({ data, origin }: MessageEvent<Blob>) => {
        if (
            origin !== 'https://memex.garden' ||
            !(data instanceof Blob) ||
            data.type !== 'application/pdf'
        ) {
            return // Ignore any unexpected messages
        }

        // data.
        this.dependencies.windowObj.removeEventListener(
            'message',
            this.handleWindowMessage,
        )
    }

    init: EventHandler<'init'> = async () => {
        this.dependencies.windowObj.addEventListener(
            'message',
            this.handleWindowMessage,
        )

        await loadInitial(this, async () => {
            const authEnforced = await this.dependencies.services.auth.enforceAuth(
                {
                    reason: 'login-requested',
                },
            )
            if (!authEnforced) {
                this.emitMutation({ needsAuth: { $set: true } })
                await this.dependencies.services.auth.waitForAuth()
                this.emitMutation({ needsAuth: { $set: false } })
            }
        })

        if (this.dependencies.fullPageUrl != null) {
            await this.createAndRouteToPageLinkForRemoteUrl()
        }
    }

    async createAndRouteToPageLinkForRemoteUrl() {
        const { services, fullPageUrl } = this.dependencies

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
        await executeUITask(this, 'linkCreationState', async () => {
            // Extract PDF data from Blob via PDFjs
            const arrayBuffer = await content.arrayBuffer()
            PDFJS.GlobalWorkerOptions.workerSrc = 'build/pdf.worker.min.js'
            const pdf = await PDFJS.getDocument(arrayBuffer as TypedArray)
                .promise
            const pdfData = await extractDataFromPDFDocument(pdf)

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

            // Start PDF upload + page link creation at the same time
            const pdfUploadPromise = services.pdfUploadService.uploadPdfContent(
                { token, content },
            )
            const pageLinkPromise = services.pageLinks.createPageLink({
                fullPageUrl: tempPDFAccessLink,
                uploadedPdfParams: {
                    uploadId,
                    title: pdfData.title,
                    fingerprints: pdfData.pdfMetadata.fingerprints,
                },
            })

            // Wait for them both to finish before routing to the new page link in the reader
            const [
                pdfUploadResult,
                { remoteListId, remoteListEntryId },
            ] = await Promise.all([pdfUploadPromise, pageLinkPromise])

            // TODO: handle bad PDF upload result

            this.routeToPageLink(remoteListId, remoteListEntryId)
        })
    }

    private routeToPageLink(listId: AutoPk, listEntryId: AutoPk): void {
        this.dependencies.services.router.goTo(
            'pageView',
            {
                id: listId.toString(),
                entryId: listEntryId.toString(),
            },
            {
                query: { noAutoOpen: 'true' },
            },
        )
    }
}
