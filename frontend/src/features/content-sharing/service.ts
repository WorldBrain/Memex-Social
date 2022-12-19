import type { ContentSharingBackendInterface } from '@worldbrain/memex-common/lib/content-sharing/backend/types'
import type {
    ProcessSharedListKeyResult,
    ListKeysServiceInterface,
} from '@worldbrain/memex-common/lib/content-sharing/service/types'
import AbstractListKeysService from '@worldbrain/memex-common/lib/content-sharing/service/list-keys'
import type { SharedListReference } from '@worldbrain/memex-common/lib/content-sharing/types'
import type RouterService from '../../services/router'
import type ContentSharingStorage from './storage'

export class ListKeysService extends AbstractListKeysService {
    backend: ContentSharingBackendInterface

    constructor(
        private dependencies: {
            backend: ContentSharingBackendInterface
            router: RouterService
            isAuthenticated: () => boolean
            storage: {
                contentSharing: ContentSharingStorage
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

    hasCurrentKey: ListKeysServiceInterface['hasCurrentKey'] = () => {
        const routeMatch = this.dependencies.router.matchCurrentUrl()
        if (
            !(
                routeMatch.route === 'collectionDetails' ||
                routeMatch.route === 'landingPage' ||
                routeMatch.route === 'userHome'
            )
        ) {
            return false
        }
        const keyString = this.dependencies.router.getQueryParam('key')
        return !!keyString
    }

    processCurrentKey: ListKeysServiceInterface['processCurrentKey'] = async (): Promise<{
        result: ProcessSharedListKeyResult
    }> => {
        const routeMatch = this.dependencies.router.matchCurrentUrl()
        const spaceId = this.dependencies.router.getSpaceId()
        if (
            !(
                routeMatch.route === 'collectionDetails' ||
                routeMatch.route === 'landingPage' ||
                routeMatch.route === 'userHome'
            )
        ) {
            return { result: 'not-supported-route' }
        }
        const keyString = this.dependencies.router.getQueryParam('key')
        if (!keyString) {
            return { result: 'no-key-present' }
        }
        if (!this.dependencies.isAuthenticated()) {
            return { result: 'not-authenticated' }
        }

        const { success } = await this.backend.processListKey({
            listId: routeMatch.params.id || spaceId,
            keyString,
        })

        return { result: success ? 'success' : 'denied' }
    }
}
