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
import {
    CollectionDetailsDeniedData,
    CreatePageEntryParams,
} from '@worldbrain/memex-common/lib/content-sharing/backend/types'
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
import { AiChatReference } from '@worldbrain/memex-common/lib/ai-chat/service/types'
import { AutoPk } from '@worldbrain/memex-common/lib/storage/types'

const LIST_DESCRIPTION_CHAR_LIMIT = 400

export interface DashboardDependencies {
    listID?: string
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
        | 'aiChat'
        | 'overlay'
        | 'events'
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
    currentListId: string | null | AutoPk
    currentEntryId: string | null
    currentNoteId: string | null
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
    importLoadState: UITaskState
    loadState: UITaskState
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
    referenceToShow: {
        type: 'annotation' | 'page'
        id: string
    } | null
    rightSideBarWidth: number
    pageToShowNotesFor: string | null
    screenState: 'ai' | 'results' | 'reader' | null
    initialChatMessage: string | null
    showAddContentOverlay: boolean
    showLoginOverlay: boolean
}

export class DashboardLogic extends Logic<
    DashboardDependencies,
    DashboardState
> {
    private personalCloudStorageUtils: UploadStorageUtils | null = null
    private _users: UserProfileCache

    getInitialState = (): DashboardState => {
        const { listId, entryId, noteId } = this.parsePathParams()

        return {
            currentListId: listId,
            currentEntryId: entryId,
            currentNoteId: noteId,
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
            referenceToShow: null,
            rightSideBarWidth: 450,
            pageToShowNotesFor: null,
            screenState: entryId ? 'reader' : 'results',
            showAddContentOverlay: false,
            showLoginOverlay: false,
        }
    }

    async initialize() {
        await executeTask(this, 'loadState', async () => {
            if (!this.state.currentListId) {
                this.setState({
                    screenState: 'results',
                    showAddContentOverlay: true,
                })
                return
            } else {
                this._users = new UserProfileCache({
                    ...this.deps,
                    onUsersLoad: (users) => {
                        this.deps.services.cache.setKey('users', users)
                    },
                })
                this.startPathnameListener()
                await this.getCurrentUserReference()
                await this.load()

                if (this.state.currentEntryId) {
                    const currentResult = this.state.results.find(
                        (entry) =>
                            entry.reference.id === this.state.currentEntryId,
                    )
                    if (currentResult) {
                        this.loadReader(currentResult)
                    }
                    const pageUrl = currentResult?.normalizedUrl
                    if (pageUrl) {
                        this.loadNotes(pageUrl)
                        this.loadReader(currentResult)
                    }
                }
            }
            this.deps.services.events.listen((data) => {
                if (
                    data.openReference &&
                    data.openReference.type === 'annotation'
                ) {
                    this.showReference(data.openReference)
                }
            })
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
        const userReference = this.deps.services.auth.getCurrentUserReference()
        this.setState({
            currentUserReference: userReference,
        })
        return userReference
    }

    async load() {
        if (!this.state.currentListId) {
            return
        }

        const response = await this.deps.services.contentSharing.backend.loadCollectionDetails(
            {
                listId: this.state.currentListId,
            },
        )
        if (response.status !== 'success') {
            if (response.status === 'permission-denied') {
                const keyString = this.deps.services.listKeys.getCurrentKey()
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
                const { auth } = this.deps.services
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

        console.log('data', data)
        const { retrievedList } = data

        const listDescription = retrievedList.sharedList.description ?? ''
        const listDescriptionFits =
            listDescription.length < LIST_DESCRIPTION_CHAR_LIMIT
        let blueskyList: BlueskyList | null = null
        let isChatIntegrationSyncing = false
        if (retrievedList.sharedList.platform === 'bsky') {
            blueskyList = await this.deps.storage.bluesky.findBlueskyListBySharedList(
                {
                    sharedList: retrievedList.sharedList.reference,
                },
            )
            if (!blueskyList) {
                return {
                    mutation: { listData: { $set: undefined } },
                }
            }
        }
        this.setState({
            results: [...this.state.results, ...retrievedList.entries],
        })

        await this.deps.services.auth.waitForAuthReady()
        const userReference = this.deps.services.auth.getCurrentUserReference()
        if (userReference) {
            this.personalCloudStorageUtils = await createPersonalCloudStorageUtils(
                {
                    userId: userReference.id,
                    storageManager: this.deps.storageManager,
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

        console.log('retrievedList.entries', retrievedList.entries)
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

        console.log(
            'this.state.annotationEntryData',
            this.state.annotationEntryData,
        )

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
        this.deps.services.cache.setKeys({
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
                    this.deps.storage.contentConversations.getThreadsForAnnotations(
                        ...args,
                    ),
                annotationReferences: Object.values(annotations).map(
                    (annotation) => annotation.reference,
                ),
                sharedListReference: {
                    type: 'shared-list-reference',
                    id: this.state.currentListId,
                },
                imageSupport: this.deps.imageSupport,
            })
            intializeNewPageReplies(this as any, {
                normalizedPageUrls: [
                    ...Object.values(annotations).map(
                        (annotation) => annotation.normalizedPageUrl,
                    ),
                ],
                imageSupport: this.deps.imageSupport,
            })
        }
    }

    showReference(reference: AiChatReference) {
        this.setState({
            rightSideBarWidth: 450,
            showRightSideBar: true,
            referenceToShow: reference,
        })
    }

    loadNotes(url: string) {
        this.setState({
            rightSideBarWidth: 450,
            showRightSideBar: true,
            pageToShowNotesFor: url,
        })
    }

    loadReader(result: CollectionDetailsListEntry) {
        this.loadNotes(result.normalizedUrl)
        this.setState({
            currentEntryId: result.reference.id,
            pageToShowNotesFor: result.normalizedUrl,
            screenState: 'reader',
        })

        this.deps.services.router.goTo('dashboard', {
            id: this.state.currentListId,
            entryId: result.reference.id,
        })
    }

    sendMessage(message: string) {
        this.setState({
            screenState: 'ai',
            initialChatMessage: message,
        })
    }

    toggleAddContentOverlay() {
        this.setState({
            showAddContentOverlay: !this.state.showAddContentOverlay,
        })
    }

    handleDroppedFiles(files: File[]) {
        console.log('files', files)
    }

    async handlePastedText(text: string) {
        if (this.deps.services.cache.getKey('currentUser') == null) {
            this.setState({
                showLoginOverlay: true,
            })
            return
        }
        console.log('text', text, this.state.currentListId)
        // Extract URLs from text using regex
        const urlRegex = /(https?:\/\/[^\s]+)/g
        const urls = text.match(urlRegex) || []

        if (urls.length === 0) {
            return
        }
        let currentListId = this.state.currentListId ?? null
        if (currentListId == null) {
            currentListId = await this.createSpaceWithEntries(urls)
            console.log('currentListId', currentListId)
        }

        if (currentListId == null) {
            return
        }

        const addedEntries = await this.deps.services.contentSharing.backend.addRemoteUrlsToList(
            {
                listReference: {
                    id: currentListId,
                    type: 'shared-list-reference',
                },
                fullPageUrls: urls,
            },
        )
        console.log('addedEntries', addedEntries)
        const newListEntries = [
            ...this.state.listData.listEntries,
            ...Object.values(addedEntries),
        ]
        this.setState({
            listData: {
                ...this.state.listData,
                listEntries: newListEntries,
            },
        })
        return newListEntries
    }

    async createSpaceWithEntries(urls?: string[], files?: File[]) {
        let entries: CreatePageEntryParams[] = []

        if (files) {
            // const spaceId = await this.deps.services.contentSharing.backend.createSpaceWithEntries({
            //     spaceTitle: 'Untitled Space',
            //     entries: {
            //         fullP
            //     },
            //     isPrivate: true,
            // })
        }
        if (urls) {
            for (let url of urls) {
                entries.push({
                    fullPageUrl: url,
                })
            }
        }
        console.log('creating space')
        try {
            const spaceCreateResponse = await this.deps.services.contentSharing.backend.createSpaceWithEntries(
                {
                    spaceTitle: 'Untitled Space',
                    entries: entries,
                    isPrivate: true,
                },
            )
            const spaceId = spaceCreateResponse.sharedListReference.id
            this.setState({
                currentListId: spaceId,
                listData: {
                    listEntries: spaceCreateResponse.listEntryReferences,
                },
            })
            window.location.href = window.location.href + '/' + spaceId
            return spaceId
        } catch (error) {
            console.error('Error creating space', error)
            return null
        }
    }
}
