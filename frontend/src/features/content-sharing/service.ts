import { ContentSharingBackendInterface } from '@worldbrain/memex-common/lib/content-sharing/backend/types'
import { ContentSharingServiceInterface } from '@worldbrain/memex-common/lib/content-sharing/service/types'
import {
    SharedListReference,
    SharedListRoleID,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import RouterService from '../../services/router'
import ContentSharingStorage from './storage'

export class ContentSharingService implements ContentSharingServiceInterface {
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
        this.backend = dependencies.backend
    }

    private getKeyLink(params: {
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

    private getKeyStringFromLink(params: { link: string }): string {
        const matchRes = params.link.match(/\?key=(\w+)/)

        if (matchRes == null || matchRes.length < 2) {
            throw new Error('Could not find key string in link')
        }

        return matchRes[1]
    }

    getExistingKeyLinksForList: ContentSharingServiceInterface['getExistingKeyLinksForList'] = async (
        params,
    ) => {
        const sharedListKeys = await this.dependencies.storage.contentSharing.getListKeys(
            { listReference: params.listReference },
        )

        const foundLinks = sharedListKeys.map((key) => {
            const keyString = key.reference.id as string
            return {
                keyString,
                roleID: key.roleID,
                link: this.getKeyLink({
                    listReference: params.listReference,
                    keyString,
                }),
            }
        })

        // In Memex-Social, there will always be a static reader link for collections,
        //  as they are "shared" already and lack the ability to unshare
        const readerLink = {
            link: this.getKeyLink({ listReference: params.listReference }),
            roleID: SharedListRoleID.Reader,
        }

        return {
            links: [readerLink, ...foundLinks],
        }
    }

    generateKeyLink: ContentSharingServiceInterface['generateKeyLink'] = async (
        params,
    ) => {
        let keyString: string | undefined

        if (params.key.roleID !== SharedListRoleID.Reader) {
            const createListResult = await this.dependencies.storage.contentSharing.createListKey(
                params,
            )
            keyString = createListResult.keyString
        }

        return {
            link: this.getKeyLink({
                listReference: params.listReference,
                keyString,
            }),
        }
    }

    deleteKeyLink: ContentSharingServiceInterface['deleteKeyLink'] = async (
        params,
    ) => {
        await this.dependencies.storage.contentSharing.deleteListKey({
            keyString: this.getKeyStringFromLink(params),
            listReference: params.listReference,
        })
    }

    hasCurrentKey: ContentSharingServiceInterface['hasCurrentKey'] = () => {
        const routeMatch = this.dependencies.router.matchCurrentUrl()
        if (routeMatch.route !== 'collectionDetails') {
            return false
        }
        const keyString = this.dependencies.router.getQueryParam('key')
        return !!keyString
    }

    processCurrentKey: ContentSharingServiceInterface['processCurrentKey'] = async () => {
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
