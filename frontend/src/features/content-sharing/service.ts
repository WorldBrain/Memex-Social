import { ContentSharingBackendInterface } from '@worldbrain/memex-common/lib/content-sharing/backend/types'
import {
    SharedListReference,
    SharedListKey,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import RouterService from '../../services/router'
import ContentSharingStorage from './storage'

export class ContentSharingService {
    backend: ContentSharingBackendInterface

    constructor(
        private dependencies: {
            backend: ContentSharingBackendInterface
            router: RouterService
            storage: {
                contentSharing: Pick<ContentSharingStorage, 'createListKey'>
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
        return `${origin}/${relativePath}?key=${params.keyString}`
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

    async processCurrentKey() {
        const resultString = <S extends string>(s: S) => ({ result: s })

        const routeMatch = this.dependencies.router.matchCurrentUrl()
        if (routeMatch.route !== 'collectionDetails') {
            return resultString('no-key-present')
        }
        const keyString = this.dependencies.router.getQueryParam('key')
        if (!keyString) {
            return resultString('no-key-present')
        }

        try {
            const { success } = await this.backend.processListKey({
                listId: routeMatch.params.id,
                keyString,
            })
            return resultString(success ? 'success' : 'denied')
        } catch (e) {
            console.log(e)
            return resultString('error')
        }
    }
}
