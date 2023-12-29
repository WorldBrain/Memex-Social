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
            // TODO 1: Move all these calls behind a single FB function
            // Get PDF Upload Token
            const uploadId = generateServerId('uploadAuditLogEntry').toString()
            const uploadResult = await services.pdfUploadService.uploadPdf({
                pdfFile: content,
                uploadId,
            })
            if (uploadResult.error != null) {
                throw new Error(uploadResult.error)
            }

            const downloadTokenResult = await services.pdfUploadService.getDownloadToken(
                {
                    uploadId,
                    // listId: ??? // TODO: Can we pre-fill this?
                },
            )

            if (downloadTokenResult.error != null) {
                throw new Error(downloadTokenResult.error)
            }

            // TODO: Switch CF URL between envs
            const tempPDFAccessLink =
                CLOUDFLARE_WORKER_URLS.staging +
                RETRIEVE_PDF_ROUTE +
                '?token=' +
                downloadTokenResult.token

            // Create actual page link using temp access link to PDF
            const {
                remoteListId,
                remoteListEntryId,
            } = await services.pageLinks.createPageLink({
                fullPageUrl: tempPDFAccessLink,
                uploadedPdfId: uploadId,
            })

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
