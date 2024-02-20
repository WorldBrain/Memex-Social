import type { StorageModules } from '../../../storage/types'
import type { UIElementServices } from '../../../services/types'
import type { UIEvent } from '../../classes/logic'
import { GenerateServerID } from '@worldbrain/memex-common/lib/content-sharing/service/types'
import { UITaskState } from '../../types'

export type LandingPageEvent = UIEvent<{
    toggle: {}
    newUrlInputChanged: { newUrlInputValue: string }
    handlePDFBlob: { file: Blob }
    setFileDragState: { fileDragState: boolean }
    handleURLtoProcess: { url: string }
    switchToBookmarkletText: boolean
    switchToExtensionDownloadText: boolean
    setFileAreaHoverState: { fileAreaHoverState: boolean }
}>
export type LandingPageState = {
    isValidUrl: boolean
    newUrlInputValue: string
    fileAreaHoverState: boolean
    linkCreationState: UITaskState
    fileDragState: boolean
    linkProcessingState: UITaskState
    showBookmarkletText: boolean
    showExtensionDownloadText: boolean
}

export interface LandingPageDependencies {
    services: UIElementServices<
        | 'auth'
        | 'overlay'
        | 'router'
        | 'webMonetization'
        | 'localStorage'
        | 'documentTitle'
        | 'pdfUploadService'
        | 'pageLinks'
    >
    storage: Pick<StorageModules, 'contentSharing'>
    generateServerId: GenerateServerID
    fullPageUrl?: string
    getRootElement: () => HTMLElement
}
