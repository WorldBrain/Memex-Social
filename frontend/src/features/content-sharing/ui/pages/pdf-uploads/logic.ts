import type { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'
import {
    UILogic,
    UIEventHandler,
    executeUITask,
    loadInitial,
} from '../../../../../main-ui/classes/logic'
import type { PdfUploadPageDependencies, PdfUploadPageEvent } from './types'

export interface PdfUploadState {
    needsAuth: boolean
    loadState: UITaskState
}

type EventHandler<EventName extends keyof PdfUploadPageEvent> = UIEventHandler<
    PdfUploadState,
    PdfUploadPageEvent,
    EventName
>

export default class PageLinkCreationLogic extends UILogic<
    PdfUploadState,
    PdfUploadPageEvent
> {
    constructor(private dependencies: PdfUploadPageDependencies) {
        super()
    }

    getInitialState(): PdfUploadState {
        return {
            needsAuth: false,
            loadState: 'pristine',
        }
    }

    init: EventHandler<'init'> = async () => {
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
    }
}
