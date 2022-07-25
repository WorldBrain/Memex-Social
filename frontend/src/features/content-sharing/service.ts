import type { ContentSharingBackendInterface } from '@worldbrain/memex-common/lib/content-sharing/backend/types'
import type {
    ProcessSharedListKeyResult,
    ListSharingServiceInterface,
} from '@worldbrain/memex-common/lib/content-sharing/service/types'
import ListSharingService from '@worldbrain/memex-common/lib/content-sharing/service/list-sharing'
import type { SharedListReference } from '@worldbrain/memex-common/lib/content-sharing/types'
import type RouterService from '../../services/router'
import type ContentSharingStorage from './storage'

export class ContentSharingService extends ListSharingService {
    backend: ContentSharingBackendInterface

    constructor(
        private dependencies: {
            backend: ContentSharingBackendInterface
            router: RouterService
            isAuthenticated: () => boolean
            storage: {
                contentSharing: Pick<
                    ContentSharingStorage,
                    'createListKey' | 'getListKeys' | 'deleteListKey'
                >
            }
        },
    ) {
        super({ serverStorage: dependencies.storage.contentSharing })
        this.backend = dependencies.backend
    }

    protected getKeyLink(params: {
        listReference: SharedListReference
        keyString?: string
    }): string {
        const origin =
            typeof window !== 'undefined'
                ? window.location.origin
                : 'https://memex.social'
        const relativePath = this.dependencies.router.getUrl(
            'collectionDetails',
            { id: params.listReference.id.toString() },
        )

        const link = origin + relativePath

        return params.keyString ? `${link}?key=${params.keyString}` : link
    }

    hasCurrentKey: ListSharingServiceInterface['hasCurrentKey'] = () => {
        const routeMatch = this.dependencies.router.matchCurrentUrl()
        if (routeMatch.route !== 'collectionDetails') {
            return false
        }
        const keyString = this.dependencies.router.getQueryParam('key')
        return !!keyString
    }

    processCurrentKey: ListSharingServiceInterface['processCurrentKey'] = async (): Promise<{
        result: ProcessSharedListKeyResult
    }> => {
        const routeMatch = this.dependencies.router.matchCurrentUrl()
        if (routeMatch.route !== 'collectionDetails') {
            return { result: 'no-key-present' }
        }
        const keyString = this.dependencies.router.getQueryParam('key')
        if (!keyString) {
            return { result: 'no-key-present' }
        }
        if (!this.dependencies.isAuthenticated()) {
            return { result: 'not-authenticated' }
        }

        const { success } = await this.backend.processListKey({
            listId: routeMatch.params.id,
            keyString,
        })
        return { result: success ? 'success' : 'denied' }
    }
}
