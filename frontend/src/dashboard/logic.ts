import { ImageSupportInterface } from '@worldbrain/memex-common/lib/image-support/types'
import { UIElementServices } from '../services/types'
import { StorageModules } from '../storage/types'
import { Logic } from '../utils/logic'
import { executeTask, TaskState } from '../utils/tasks'
import { executeUITask } from '../main-ui/classes/logic'
import { BlueskyList } from '@worldbrain/memex-common/lib/bsky/storage/types'
import { createPersonalCloudStorageUtils } from '@worldbrain/memex-common/lib/content-sharing/storage/utils'
import {
    SharedList,
    SharedListReference,
    SharedListRole,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import { SharedListRoleID } from '@worldbrain/memex-common/lib/content-sharing/types'
import { UserReference } from '../features/user-management/types'
import { CollectionDetailsDeniedData } from '@worldbrain/memex-common/lib/content-sharing/backend/types'
import { CollectionDetailsListEntry } from '../features/content-sharing/ui/pages/collection-details/types'
import { UploadStorageUtils } from '@worldbrain/memex-common/lib/personal-cloud/backend/translation-layer/storage-utils'
import StorageManager from '@worldbrain/storex'
import { PAGE_SIZE } from '../features/content-sharing/ui/pages/collection-details/constants'
import { getInitialNewReplyState } from '../features/content-conversations/ui/utils'
import { UITaskState } from '../main-ui/types'
import {
    GetAnnotationListEntriesResult,
    GetAnnotationsResult,
} from '@worldbrain/memex-common/lib/content-sharing/storage/types'
import { PreparedThread } from '@worldbrain/memex-common/lib/content-conversations/storage/types'
import {
    detectAnnotationConversationThreads,
    intializeNewPageReplies,
} from '../features/content-conversations/ui/logic'
import { CreationInfoProps } from '@worldbrain/memex-common/lib/common-ui/components/creation-info'
import { NewReplyState } from '../features/content-conversations/ui/types'
import UserProfileCache from '../features/user-management/utils/user-profile-cache'
import { ContentSharingQueryParams } from '../features/content-sharing/types'
import { GenerateServerID } from '@worldbrain/memex-common/lib/content-sharing/service/types'
import { URLNormalizer } from '@worldbrain/memex-common/lib/url-utils/normalize/types'
import { getRoutePartGroups } from '../services/router/routes'

const LIST_DESCRIPTION_CHAR_LIMIT = 400

export interface DashboardDependencies {
    listID: string
    entryID?: string
    noteId?: string
    normalizeUrl: URLNormalizer
    generateServerId: GenerateServerID
    query: ContentSharingQueryParams
    pdfBlob?: Blob
    services: UIElementServices<
        | 'auth'
        | 'cache'
        | 'bluesky'
        | 'overlay'
        | 'listKeys'
        | 'contentSharing'
        | 'contentConversations'
        | 'activityStreams'
        | 'router'
        | 'activityStreams'
        | 'documentTitle'
        | 'userManagement'
        | 'localStorage'
        | 'clipboard'
        | 'userMessages'
        | 'youtube'
        | 'memexExtension'
        | 'summarization'
        | 'fullTextSearch'
    >
    storage: Pick<
        StorageModules,
        | 'contentSharing'
        | 'contentConversations'
        | 'users'
        | 'bluesky'
        | 'slack'
        | 'slackRetroSync'
        | 'discord'
        | 'discordRetroSync'
        | 'activityStreams'
        | 'activityFollows'
    >
    imageSupport: ImageSupportInterface
    getRootElement: () => HTMLElement
    storageManager: StorageManager
}

export type DashboardState = {
    currentUserReference: UserReference | null
    currentListId: string
    currentEntryId: string
    currentNoteId: string
    listData: {
        reference: SharedListReference
        pageSize: number
        blueskyList: BlueskyList | null
        isChatIntegrationSyncing: boolean
        creatorReference: UserReference
        list: SharedList | null
        listEntries: CollectionDetailsListEntry[]
        listDescriptionState: 'collapsed' | 'fits'
    }
    loadState: TaskState
    listRoleID?: SharedListRoleID
    listRoles?: Array<SharedListRole & { user: UserReference }>
    listKeyPresent?: boolean
    listRoleLimit: number | null // how many collaborators to show in the subtitle
    permissionDenied?: CollectionDetailsDeniedData & { hasKey: boolean }
    results: CollectionDetailsListEntry[]
    permissionKeyResult: 'pristine' | 'success' | 'not-authenticated'
    pageAnnotationsExpanded: { [normalizedPageUrl: string]: boolean }
    newPageReplies: { [normalizedPageUrl: string]: NewReplyState }
    requestingAuth: boolean
    annotationEntriesLoadState: UITaskState
    annotationEntryData: GetAnnotationListEntriesResult
    isListOwner: boolean
    showLeftSideBar: boolean
    showRightSideBar: boolean
    rightSideBarWidth: number
    pageToShowNotesFor: string | null
    screenState: 'ai' | 'results' | 'reader' | null
}

export class DashboardLogic extends Logic<DashboardState> {
    private personalCloudStorageUtils: UploadStorageUtils | null = null
    private _users: UserProfileCache

    constructor(public props: DashboardDependencies) {
        super()

        this._users = new UserProfileCache({
            ...props,
            onUsersLoad: (users) => {
                this.props.services.cache.setKey('users', users)
            },
        })
    }

    getInitialState = (): DashboardState => {
        const { listId, entryId, noteId } = this.parsePathParams()

        return {
            currentListId: listId ?? '',
            currentEntryId: entryId ?? '',
            currentNoteId: noteId ?? '',
            currentUserReference: null,
            listData: {
                reference: {
                    type: 'shared-list-reference',
                    id: listId ?? '',
                },
                pageSize: PAGE_SIZE,
                blueskyList: null,
                isChatIntegrationSyncing: false,
                creatorReference: { type: 'user-reference', id: '' },
                list: null,
                listEntries: [],
                listDescriptionState: 'collapsed',
            },
            loadState: 'pristine',
            listRoleID: undefined,
            listRoles: [],
            listKeyPresent: false,
            listRoleLimit: null,
            results: [],
            permissionKeyResult: 'pristine',
            pageAnnotationsExpanded: {},
            requestingAuth: false,
            annotationEntriesLoadState: 'pristine',
            annotationEntryData: {},
            isListOwner: false,
            newPageReplies: {},
            showLeftSideBar: false,
            showRightSideBar: entryId ? true : false,
            rightSideBarWidth: 450,
            pageToShowNotesFor: null,
            screenState: 'results',
        }
    }

    async initialize() {
        await executeTask(this, 'loadState', async () => {
            this.startPathnameListener()
            await this.getCurrentUserReference()
            await this.load()
        })
    }

    startPathnameListener() {
        window.addEventListener('popstate', this.updatePathState)
        window.addEventListener('pushstate', this.updatePathState)
        window.addEventListener('replacestate', this.updatePathState)
    }

    stopPathnameListener() {
        window.removeEventListener('popstate', this.updatePathState)
        window.removeEventListener('pushstate', this.updatePathState)
        window.removeEventListener('replacestate', this.updatePathState)
    }

    async cleanup() {
        this.stopPathnameListener()
    }

    updatePathState() {
        console.log('updatePathState', window.location.pathname)
        const { listId, entryId, noteId } = this.parsePathParams()
        this.setState({
            currentListId: listId ?? '',
            currentEntryId: entryId ?? '',
            currentNoteId: noteId ?? '',
        })
    }

    private parsePathParams(): {
        listId: string | null
        entryId: string | null
        noteId: string | null
    } {
        const pathname = window.location.pathname
        // Match pattern: /c/:listId/p/:entryId/a/:noteId
        const pattern = /^\/d\/([^\/]+)(?:\/p\/([^\/]+))?(?:\/a\/([^\/]+))?/
        const matches = pathname.match(pattern)

        if (!matches) {
            return { listId: null, entryId: null, noteId: null }
        }

        return {
            listId: matches[1] || null,
            entryId: matches[2] || null,
            noteId: matches[3] || null,
        }
    }

    async getCurrentUserReference() {
        const userReference = this.props.services.auth.getCurrentUserReference()
        this.setState({
            currentUserReference: userReference,
        })
        return userReference
    }

    async load() {
        console.log('start load')
        const response = await this.props.services.contentSharing.backend.loadCollectionDetails(
            {
                listId: this.state.currentListId,
            },
        )
        if (response.status !== 'success') {
            if (response.status === 'permission-denied') {
                const keyString = this.props.services.listKeys.getCurrentKey()
                await this.loadUsers(
                    [
                        {
                            type: 'user-reference',
                            id: response.data.creator,
                        },
                    ],
                    {
                        loadBlueskyUsers: false,
                    },
                )
                const permissionDeniedData = {
                    ...response.data,
                    hasKey: !!keyString,
                }
                this.setState({
                    listRoles: [],
                    permissionDenied: permissionDeniedData,
                })
                const { auth } = this.props.services
                const currentUser = auth.getCurrentUser()
                // if (!currentUser) {
                //     await auth.requestAuth({
                //         header: (
                //             <LoggedOutAccessBox
                //                 keyString={keyString}
                //                 permissionDenied={permissionDeniedData}
                //             />
                //         ),
                //     })
                //     this.processUIEvent('load', {
                //         event: { isUpdate: false },
                //         previousState: incoming.previousState,
                //     })
                // }
            }
            return
        }
        const { data } = response
        const { retrievedList } = data

        console.log('retrievedList', retrievedList)

        const listDescription = retrievedList.sharedList.description ?? ''
        const listDescriptionFits =
            listDescription.length < LIST_DESCRIPTION_CHAR_LIMIT
        let blueskyList: BlueskyList | null = null
        let isChatIntegrationSyncing = false
        if (retrievedList.sharedList.platform === 'bsky') {
            blueskyList = await this.props.storage.bluesky.findBlueskyListBySharedList(
                {
                    sharedList: retrievedList.sharedList.reference,
                },
            )
            console.log('blueskyList', blueskyList)
            if (!blueskyList) {
                return {
                    mutation: { listData: { $set: undefined } },
                }
            }
        }
        this.setState({
            results: [...this.state.results, ...retrievedList.entries],
        })

        await this.props.services.auth.waitForAuthReady()
        const userReference = this.props.services.auth.getCurrentUserReference()
        if (userReference) {
            this.personalCloudStorageUtils = await createPersonalCloudStorageUtils(
                {
                    userId: userReference.id,
                    storageManager: this.props.storageManager,
                },
            )
        }

        const baseListRoles = data.rolesByList[this.state.currentListId] ?? []
        const isAuthenticated = !!userReference
        const isContributor =
            (userReference &&
                baseListRoles.find((role) => role.user.id === userReference.id)
                    ?.roleID) ??
            undefined

        if (isAuthenticated && isContributor) {
            this.setState({
                permissionKeyResult: 'success',
            })
        } else {
            this.setState({
                permissionKeyResult: 'not-authenticated',
                requestingAuth: true,
            })
        }

        console.log('before loadUsers')

        const loadedUsers = await this.loadUsers(
            [
                retrievedList.creator,
                ...new Set([
                    ...data.usersToLoad.map(
                        (id) =>
                            ({
                                type: 'user-reference',
                                id,
                            } as UserReference),
                    ),
                    ...baseListRoles.map((role) => role.user),
                ]),
            ],
            { loadBlueskyUsers: false },
        )

        this.setState({
            currentUserReference: userReference,
            listData: {
                reference: retrievedList.sharedList.reference,
                pageSize: PAGE_SIZE,
                blueskyList,
                isChatIntegrationSyncing,
                creatorReference: data.retrievedList.creator,
                list: retrievedList.sharedList,
                listEntries: retrievedList.entries,
                listDescriptionState: listDescriptionFits
                    ? 'fits'
                    : 'collapsed',
            },
            listRoles: baseListRoles,
            isListOwner: retrievedList.creator.id === userReference?.id,
            newPageReplies: Object.fromEntries(
                retrievedList.entries.map((entry) => [
                    entry.normalizedUrl,
                    getInitialNewReplyState(),
                ]),
            ),
            annotationEntriesLoadState: 'success',
            annotationEntryData: data.annotationEntries,
        })

        console.log('state', this.state)

        if (this.state.currentEntryId) {
            const normalizedPageUrl = retrievedList.entries[0].normalizedUrl
            this.setState({
                pageAnnotationsExpanded: {
                    [normalizedPageUrl]: true,
                },
            })
            await this.initializePageAnnotations(
                // data.usersToLoad,
                data.annotations!,
                data.threads,
            )
        }
        console.log('users', this.props.services.cache.getKey('users'))
    }

    async loadUsers(
        userReferences: UserReference[],
        params: {
            loadBlueskyUsers: boolean
        },
    ): Promise<{
        [id: string]: CreationInfoProps['creatorInfo']
    }> {
        // Load base user data
        let result = await this._users.loadUsers(
            userReferences,
            params.loadBlueskyUsers,
        )
        this.props.services.cache.setKeys({
            users: result,
        })

        return result
    }

    async initializePageAnnotations(
        // usersToLoad: AutoPk[],
        annotations: GetAnnotationsResult,
        threads?: PreparedThread[],
    ) {
        if (threads) {
            await detectAnnotationConversationThreads(this as any, {
                threads,
                getThreadsForAnnotations: (...args) =>
                    this.props.storage.contentConversations.getThreadsForAnnotations(
                        ...args,
                    ),
                annotationReferences: Object.values(annotations).map(
                    (annotation) => annotation.reference,
                ),
                sharedListReference: {
                    type: 'shared-list-reference',
                    id: this.state.currentListId,
                },
                imageSupport: this.props.imageSupport,
            })
            intializeNewPageReplies(this as any, {
                normalizedPageUrls: [
                    ...Object.values(annotations).map(
                        (annotation) => annotation.normalizedPageUrl,
                    ),
                ],
                imageSupport: this.props.imageSupport,
            })
        }
    }

    loadNotes(url: string) {
        console.log('loadNotes', url)
        this.setState({
            rightSideBarWidth: 450,
            showRightSideBar: true,
            pageToShowNotesFor: url,
        })
    }

    loadReader(result: CollectionDetailsListEntry) {
        this.setState({
            currentEntryId: result.reference.id,
        })

        this.loadNotes(result.normalizedUrl)
    }
}
