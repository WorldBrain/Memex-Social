import { ContentSharingBackendInterface } from '@worldbrain/memex-common/lib/content-sharing/backend/types'
import {
    SharedListReference,
    SharedListKey,
    SharedListRoleID,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import RouterService from '../../services/router'
import ContentSharingStorage from './storage'

export type ProcessSharedListKeyResult =
    | 'no-key-present'
    | 'not-authenticated'
    | 'success'
    | 'denied'

export class ContentSharingService {
    backend: ContentSharingBackendInterface

    constructor(
        private dependencies: {
            backend: ContentSharingBackendInterface
            router: RouterService
            isAuthenticated: () => boolean
            storage: {
                contentSharing: Pick<
                    ContentSharingStorage,
                    'createListKey' | 'getListKeys'
                >
            }
        },
    ) {
        this.backend = dependencies.backend
    }

    getKeyLink(params: {
        listReference: SharedListReference
        keyString: string
    }) {
        const origin =
            typeof window !== 'undefined'
                ? window.location.origin
                : 'https://memex.social'
        const relativePath = this.dependencies.router.getUrl(
            'collectionDetails',
            { id: params.listReference.id.toString() },
        )
        return `${origin}${relativePath}?key=${params.keyString}`
    }

    async getExistingKeyLinksForList(params: {
        listReference: SharedListReference
    }): Promise<{
        links: Array<{
            link: string
            keyString: string
            roleID: SharedListRoleID
        }>
    }> {
        const sharedListKeys = await this.dependencies.storage.contentSharing.getListKeys(
            { listReference: params.listReference },
        )

        return {
            links: sharedListKeys.map((key) => {
                const keyString = key.reference.id as string
                return {
                    keyString,
                    roleID: key.roleID,
                    link: this.getKeyLink({
                        listReference: params.listReference,
                        keyString,
                    }),
                }
            }),
        }
    }

    async generateKeyLink(params: {
        key: Pick<SharedListKey, 'roleID' | 'disabled'>
        listReference: SharedListReference
    }): Promise<{ link: string; keyString: string }> {
        const {
            keyString,
        } = await this.dependencies.storage.contentSharing.createListKey(params)
        return {
            keyString,
            link: this.getKeyLink({
                listReference: params.listReference,
                keyString,
            }),
        }
    }

    async processCurrentKey(): Promise<{ result: ProcessSharedListKeyResult }> {
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
