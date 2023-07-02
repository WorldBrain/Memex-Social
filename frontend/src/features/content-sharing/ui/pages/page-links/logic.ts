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
    constructor(private dependencies: PageLinkCreationPageDependencies) {
        super()
    }

    getInitialState(): PageLinkCreationState {
        return {
            needsAuth: false,
            loadState: 'pristine',
            linkCreationState: 'pristine',
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

        await this.createAndRouteToPageLink()
    }

    async createAndRouteToPageLink() {
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

            services.router.goTo(
                'pageView',
                {
                    id: remoteListId.toString(),
                    entryId: remoteListEntryId.toString(),
                },
                {
                    query: { noAutoOpen: 'true' },
                },
            )
        })
    }
}
