import chunk from 'lodash/chunk'
import fromPairs from 'lodash/fromPairs'
import {
    SharedAnnotationReference,
    SharedListReference,
    SharedListRoleID,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import {
    GetAnnotationListEntriesResult,
    GetAnnotationsResult,
    GetAnnotationListEntriesElement,
} from '@worldbrain/memex-common/lib/content-sharing/storage/types'
import {
    CollectionDetailsEvent,
    CollectionDetailsDependencies,
    CollectionDetailsSignal,
    CollectionDetailsState,
    CollectionDetailsListEntry,
} from './types'
import {
    UILogic,
    UIEventHandler,
    executeUITask,
} from '../../../../../main-ui/classes/logic'
import { UIMutation } from 'ui-logic-core'
import flatten from 'lodash/flatten'
import { PAGE_SIZE } from './constants'
import {
    annotationConversationInitialState,
    annotationConversationEventHandlers,
    detectAnnotationConversationThreads,
    setupConversationLogicDeps,
    intializeNewPageReplies,
} from '../../../../content-conversations/ui/logic'
import {
    getInitialNewReplyState,
    getInitialAnnotationConversationStates,
} from '../../../../content-conversations/ui/utils'
import mapValues from 'lodash/mapValues'
import UserProfileCache from '../../../../user-management/utils/user-profile-cache'
import {
    listsSidebarInitialState,
    listsSidebarEventHandlers,
} from '../../../../lists-sidebar/ui/logic'
import {
    extDetectionInitialState,
    extDetectionEventHandlers,
} from '../../../../ext-detection/ui/logic'
import { UserReference } from '../../../../user-management/types'
import { makeStorageReference } from '@worldbrain/memex-common/lib/storage/references'
import type { DiscordList } from '@worldbrain/memex-common/lib/discord/types'
import type { SlackList } from '@worldbrain/memex-common/lib/slack/types'
import * as chrono from 'chrono-node'
import type { SharedListEntrySearchRequest } from '@worldbrain/memex-common/lib/content-sharing/search'
const truncate = require('truncate')

const LIST_DESCRIPTION_CHAR_LIMIT = 400

type EventHandler<
    EventName extends keyof CollectionDetailsEvent
> = UIEventHandler<CollectionDetailsState, CollectionDetailsEvent, EventName>

export default class CollectionDetailsLogic extends UILogic<
    CollectionDetailsState,
    CollectionDetailsEvent
> {
    pageAnnotationPromises: { [normalizedPageUrl: string]: Promise<void> } = {}
    conversationThreadPromises: {
        [normalizePageUrl: string]: Promise<void>
    } = {}
    _users: UserProfileCache
    _creatorReference: UserReference | null = null

    // Without search, we're expanding the mainListEntries as we paginate
    mainListEntries: CollectionDetailsListEntry[] = []
    mainLatestEntryIndex = 0
    // If there's an active search query, the 1-based page is stored in this request
    latestSearchRequest?: SharedListEntrySearchRequest

    constructor(private dependencies: CollectionDetailsDependencies) {
        super()

        this._users = new UserProfileCache({
            ...dependencies,
            onUsersLoad: (users) => {
                this.emitMutation({ users: { $merge: users } })
            },
        })

        Object.assign(
            this,
            annotationConversationEventHandlers<CollectionDetailsState>(
                this as any,
                {
                    ...this.dependencies,
                    ...setupConversationLogicDeps(this.dependencies),
                    selectAnnotationData: (state, reference) => {
                        const annotationId = this.dependencies.storage.contentSharing.getSharedAnnotationLinkID(
                            reference,
                        )
                        const annotation = state.annotations[annotationId]
                        if (!annotation) {
                            return null
                        }
                        return {
                            normalizedPageUrl: annotation.normalizedPageUrl,
                            pageCreatorReference: annotation.creator,
                        }
                    },
                    loadUserByReference: (reference) =>
                        this._users.loadUser(reference),
                    onNewAnnotationCreate: (_, annotation, sharedListEntry) => {
                        this.emitMutation({
                            annotations: {
                                [annotation.linkId]: {
                                    $set: annotation,
                                },
                            },
                            annotationEntryData: {
                                [annotation.normalizedPageUrl]: {
                                    $apply: (
                                        previousState?: GetAnnotationListEntriesElement[],
                                    ) => [
                                        ...(previousState ?? []),
                                        {
                                            ...sharedListEntry!,
                                            creator: annotation.creator,
                                            sharedAnnotation:
                                                annotation.reference,
                                        },
                                    ],
                                },
                            },
                        })
                        return this.dependencies.services.userMessages.pushMessage(
                            {
                                type: 'created-annotation',
                                sharedAnnotationId: annotation.reference.id,
                            },
                        )
                    },
                },
            ),
        )

        Object.assign(
            this,
            listsSidebarEventHandlers(this as any, {
                ...this.dependencies,
                localStorage: this.dependencies.services.localStorage,
            }),
        )

        Object.assign(
            this,
            extDetectionEventHandlers(this as any, {
                ...this.dependencies,
            }),
        )
    }

    updateScrollState: EventHandler<'updateScrollState'> = async ({
        event,
    }) => {
        const mainArea = document.getElementById('MainContainer')
        if (mainArea) {
            mainArea.onscroll = () => {
                const previousScrollTop = event.previousScrollTop
                const currentScroll = mainArea.scrollTop

                if (
                    (currentScroll > 100 &&
                        currentScroll - previousScrollTop > 0) ||
                    currentScroll === 0
                ) {
                    this.emitMutation({
                        scrollTop: { $set: mainArea?.scrollTop },
                    })
                }
            }
        }
    }

    getInitialState(): CollectionDetailsState {
        return {
            listLoadState: 'pristine',
            followLoadState: 'running',
            permissionKeyState: 'running',
            listRolesLoadState: 'running',
            copiedLink: false,
            showMoreCollaborators: false,
            listRoleLimit: 3,
            listKeyPresent: this.dependencies.services.listKeys.hasCurrentKey(),
            summarizeArticleLoadState: {},
            articleSummary: {},
            users: {},
            scrollTop: 0,
            annotationEntriesLoadState: 'pristine',
            annotationLoadStates: {},
            annotations: {},
            isCollectionFollowed: false,
            allAnnotationExpanded: false,
            isListShareModalShown: false,
            pageAnnotationsExpanded: {},
            searchType: 'pages',
            hoverState: false,
            renderEmbedModal: false,
            isEmbedShareModalCopyTextShown: '',
            searchQuery: '',
            dateFilterVisible: false,
            startDateFilterValue: '',
            endDateFilterValue: '',
            resultLoadingState: 'pristine',
            paginateLoading: 'pristine',
            ...extDetectionInitialState(),
            ...listsSidebarInitialState(),
            ...annotationConversationInitialState(),
        }
    }

    init: EventHandler<'init'> = async (incoming) => {
        await this.processUIEvent('load', {
            ...incoming,
            event: { isUpdate: false },
        })
    }

    load: EventHandler<'load'> = async (incoming) => {
        if (incoming.event.listID) {
            this.dependencies.listID = incoming.event.listID
        }

        // NOTE: Following promises are made to return void because
        // without this the IDE slows down a lot trying to infer types
        await Promise.all([
            this.processUIEvent('loadListData', {
                ...incoming,
                event: { listID: this.dependencies.listID },
            }).then(() => {}),
            !incoming.event.isUpdate
                ? this.processUIEvent('processPermissionKey', {
                      ...incoming,
                      event: {},
                  }).then(() => {})
                : null,
        ])

        await Promise.all([
            this.processUIEvent('initActivityFollows', {
                ...incoming,
                event: undefined,
            }).then(() => {}),
            this.loadFollowBtnState().then(() => {}),
            this.loadListRoles(),
        ])
    }

    processPermissionKey: EventHandler<'processPermissionKey'> = async (
        incoming,
    ) => {
        if (!this.dependencies.services.listKeys.hasCurrentKey()) {
            return this.emitMutation({
                permissionKeyState: { $set: 'success' },
            })
        }
        await executeUITask<CollectionDetailsState>(
            this,
            'permissionKeyState',
            async () => {
                await this.dependencies.services.auth.waitForAuthReady()

                const listReference = makeStorageReference<SharedListReference>(
                    'shared-list-reference',
                    this.dependencies.listID,
                )
                const userReference = this.dependencies.services.auth.getCurrentUserReference()
                const listRoles = await this.dependencies.storage.contentSharing.getListRoles(
                    { listReference },
                )

                const isAuthenticated = userReference

                const isContributor =
                    (userReference &&
                        listRoles.find(
                            (role) => role.user.id === userReference.id,
                        )?.roleID) ??
                    undefined

                if (isAuthenticated && isContributor) {
                    this.emitMutation({
                        permissionKeyResult: { $set: 'success' },
                    })
                } else {
                    this.emitMutation({
                        permissionKeyResult: { $set: 'not-authenticated' },
                        requestingAuth: { $set: true },
                    })
                }
            },
        )
    }

    setSearchType: EventHandler<'setPageHover'> = ({
        event,
        previousState,
    }) => {
        this.emitMutation({
            searchType: { $set: event },
        })
    }

    setPageHover: EventHandler<'setPageHover'> = ({ event, previousState }) => {
        this.emitMutation({
            listData: {
                listEntries: {
                    [event.entryIndex]: {
                        hoverState: {
                            $set: !previousState.listData?.listEntries[
                                event.entryIndex
                            ].hoverState,
                        },
                    },
                },
            },
        })
    }

    copiedLinkButton: EventHandler<'copiedLinkButton'> = () => {
        this.emitMutation({
            copiedLink: { $set: true },
        })
        setTimeout(() => {
            this.emitMutation({
                copiedLink: { $set: false },
            })
        }, 2000)
    }

    isExcludedDomain(url: string) {
        if (
            url.startsWith('htts://www.youtube.com/watch') ||
            url.endsWith('.pdf')
        ) {
            return true
        }
    }

    summarizeArticle: EventHandler<'summarizeArticle'> = async (incoming) => {
        this.emitMutation({
            summarizeArticleLoadState: {
                [incoming.event.entry.normalizedUrl]: { $set: 'running' },
            },
        })

        let isPageSummaryEmpty = true
        for await (const result of this.dependencies.services.summarization.queryAI(
            incoming.event.entry.sourceUrl,
            undefined,
            undefined,
            undefined,
            true,
            true,
        )) {
            const token = result?.t

            let newToken = token
            if (isPageSummaryEmpty) {
                newToken = newToken.trimStart() // Remove the first two characters
            }

            isPageSummaryEmpty = false

            this.emitMutation({
                summarizeArticleLoadState: {
                    [incoming.event.entry.normalizedUrl]: { $set: 'success' },
                },
                articleSummary: {
                    [incoming.event.entry.normalizedUrl]: {
                        $apply: (prev) => (prev ? prev : '') + newToken,
                    },
                },
            })
        }
    }
    hideSummary: EventHandler<'hideSummary'> = (incoming) => {
        this.emitMutation({
            summarizeArticleLoadState: {
                [incoming.event.entry.normalizedUrl]: { $set: undefined },
            },
        })
    }

    acceptInvitation: EventHandler<'acceptInvitation'> = async (incoming) => {
        await executeUITask<CollectionDetailsState>(
            this,
            'permissionKeyState',
            async () => {
                await this.dependencies.services.auth.waitForAuthReady()

                const userReference = this.dependencies.services.auth.getCurrentUserReference()
                const sucessMutation: UIMutation<CollectionDetailsState> = {
                    listRoleID: { $set: SharedListRoleID.ReadWrite },
                    listRoles: {
                        $unshift: [
                            {
                                createdWhen: Date.now(),
                                updatedWhen: Date.now(),
                                roleID: SharedListRoleID.ReadWrite,
                                user: userReference!,
                            },
                        ],
                    },
                }

                const {
                    result,
                } = await this.dependencies.services.listKeys.processCurrentKey()
                if (result !== 'not-authenticated') {
                    return {
                        mutation: {
                            permissionKeyResult: { $set: result },
                            requestingAuth: { $set: false },
                            ...(result === 'success' ? sucessMutation : {}),
                        },
                    }
                }

                this.emitMutation({ requestingAuth: { $set: true } })
                const {
                    result: authResult,
                } = await this.dependencies.services.auth.requestAuth({
                    reason: 'login-requested',
                })
                if (
                    authResult.status === 'cancelled' ||
                    authResult.status === 'error'
                ) {
                    return
                } else {
                    const {
                        result: secondKeyResult,
                    } = await this.dependencies.services.listKeys.processCurrentKey()

                    return {
                        mutation: {
                            permissionKeyResult: { $set: secondKeyResult },
                            permissionKeyState: { $set: 'success' },
                            requestingAuth: { $set: false },
                            ...sucessMutation,
                        },
                    }
                }
            },
        )
    }

    closePermissionOverlay: EventHandler<'closePermissionOverlay'> = (
        incoming,
    ) => {
        return {
            permissionKeyState: { $set: 'success' },
            permissionKeyResult: { $set: 'no-key-present' },
        }
    }

    async loadListRoles() {
        const listReference = makeStorageReference<SharedListReference>(
            'shared-list-reference',
            this.dependencies.listID,
        )

        let usersToLoad: UserReference[] = []
        await executeUITask<CollectionDetailsState>(
            this,
            'listRolesLoadState',
            async () => {
                const userReference = this.dependencies.services.auth.getCurrentUserReference()
                const listRoles = await this.dependencies.storage.contentSharing.getListRoles(
                    { listReference },
                )
                usersToLoad = listRoles.map((role) => role.user)
                let roleID: SharedListRoleID | undefined = undefined
                if (
                    this._creatorReference &&
                    userReference?.id === this._creatorReference?.id
                ) {
                    roleID = SharedListRoleID.Owner
                } else {
                    roleID =
                        (userReference &&
                            listRoles.find(
                                (role) => role.user.id === userReference.id,
                            )?.roleID) ??
                        undefined
                }
                this.emitMutation({
                    listRoleID: {
                        $set: roleID,
                    },
                    listRoles: { $set: listRoles },
                })
            },
        )
        await this._users.loadUsers(usersToLoad)
    }

    updateSearchQuery: EventHandler<'updateSearchQuery'> = (incoming) => {
        this.emitMutation({
            searchQuery: { $set: incoming.event.query },
        })
    }

    toggleDateFilters: EventHandler<'toggleDateFilters'> = (incoming) => {
        this.emitMutation({
            dateFilterVisible: {
                $set: !incoming.previousState.dateFilterVisible,
            },
        })
    }

    loadSearchResults: EventHandler<'loadSearchResults'> = async (incoming) => {
        this.emitMutation({
            resultLoadingState: { $set: 'running' },
        })
        const startNlpDate =
            chrono?.parseDate(incoming.event.startDateFilterValue) ?? undefined
        const endNlpDate =
            chrono?.parseDate(incoming.event.endDateFilterValue) ?? undefined

        if (!incoming.event.query?.length && !startNlpDate && !endNlpDate) {
            delete this.latestSearchRequest
            this.emitMutation({
                searchQuery: { $set: '' },
                listData: {
                    pageSize: { $set: PAGE_SIZE },
                    listEntries: {
                        $set: this.mainListEntries.sort(
                            (entryA, entryB) =>
                                entryB.createdWhen - entryA.createdWhen,
                        ),
                    },
                },
            })
            this.emitMutation({
                resultLoadingState: { $set: 'success' },
            })
            return
        }

        const startDateFilterValue = parseInt(
            startNlpDate?.getTime().toString().slice(0, -3).concat('000'),
        )
        const endDateFilterValue = parseInt(
            endNlpDate?.getTime().toString().slice(0, -3).concat('000'),
        )

        this.latestSearchRequest = {
            query: incoming.event.query,
            sharedListIds: [incoming.event.sharedListIds],
            fromTimestamp: startDateFilterValue,
            toTimestamp: endDateFilterValue,
            page: 1,
            pageSize: 6,
        }
        this.emitMutation({
            searchQuery: { $set: incoming.event.query },
            startDateFilterValue: {
                $set: incoming.event.startDateFilterValue,
            },
            endDateFilterValue: { $set: incoming.event.endDateFilterValue },
            resultLoadingState: { $set: 'success' },
            listData: {
                pageSize: {
                    $set: incoming.event.query.length
                        ? this.latestSearchRequest.pageSize!
                        : PAGE_SIZE,
                },
            },
        })

        let result = await this.dependencies.services.fullTextSearch.searchListEntries(
            this.latestSearchRequest,
        )

        if (result) {
            // this._creatorReference = result.sharedListEntries.creator
            const userIds = [
                ...new Set(
                    result.sharedListEntries.map((entry: any) => entry.creator),
                ),
            ]

            result.sharedListEntries.sort((a: any, b: any) => {
                return b.createdWhen - a.createdWhen
            })

            await this._users.loadUsers(
                userIds.map(
                    (id): UserReference => ({
                        type: 'user-reference',
                        id,
                    }),
                ),
            )

            this.emitMutation({
                listData: {
                    listEntries: {
                        $set: result.sharedListEntries.map(
                            (entry): CollectionDetailsListEntry => ({
                                ...entry,
                                creator: {
                                    type: 'user-reference',
                                    id: entry.creator,
                                },
                                sourceUrl: entry.originalUrl,
                                updatedWhen: entry.createdWhen,
                                reference: {
                                    id: entry.id,
                                    type: 'shared-list-entry-reference',
                                },
                            }),
                        ),
                    },
                },
                // newPageReplies: {
                //     $set: fromPairs(
                //         result.entries.map((entry) => [
                //             entry.normalizedUrl,
                //             getInitialNewReplyState(),
                //         ]),
                //     ),
                // },
            })
        } else {
            this.emitMutation({ listData: { $set: undefined } })
        }
    }

    loadListData: EventHandler<'loadListData'> = async (incoming) => {
        const {
            contentSharing,
            slack,
            discord,
            slackRetroSync,
            discordRetroSync,
        } = this.dependencies.storage
        const listReference = makeStorageReference<SharedListReference>(
            'shared-list-reference',
            incoming.event.listID,
        )
        const {
            success: listDataSuccess,
        } = await executeUITask<CollectionDetailsState>(
            this,
            'listLoadState',
            async () => {
                this.emitSignal<CollectionDetailsSignal>({
                    type: 'loading-started',
                })

                const result = await contentSharing.retrieveList(
                    listReference,
                    {
                        fetchSingleEntry: this.dependencies.entryID
                            ? {
                                  type:
                                      'shared-annotation-list-entry-reference',
                                  id: this.dependencies.entryID,
                              }
                            : undefined,
                        maxEntryCount: PAGE_SIZE,
                    },
                )

                if (this.dependencies.entryID) {
                    const normalizedPageUrl = result.entries[0].normalizedUrl
                    const entriesByList = await contentSharing.getAnnotationListEntriesForListsOnPage(
                        {
                            listReferences: [listReference],
                            normalizedPageUrl,
                        },
                    )
                    const entries = entriesByList[listReference.id] ?? []
                    if (!entries.length) {
                        return
                    }

                    this.emitMutation({
                        pageAnnotationsExpanded: {
                            [normalizedPageUrl]: { $set: true },
                        },
                    })

                    await this.loadPageAnnotations(
                        { [normalizedPageUrl]: entries },
                        [normalizedPageUrl],
                    )
                    if (this.dependencies.query.annotationId) {
                        this.processUIEvent('toggleAnnotationReplies', {
                            previousState: incoming.getState!(),
                            event: {
                                sharedListReference: listReference,
                                annotationReference: {
                                    type: 'shared-annotation-reference',
                                    id: this.dependencies.query.annotationId,
                                },
                            },
                        })
                    }
                }

                if (result) {
                    this._creatorReference = result.creator
                    const userIds = [
                        ...new Set(
                            result.entries.map((entry) => entry.creator.id),
                        ),
                    ]
                    await this._users.loadUsers(
                        userIds.map(
                            (id): UserReference => ({
                                type: 'user-reference',
                                id,
                            }),
                        ),
                    )

                    const listDescription = result.sharedList.description ?? ''
                    const listDescriptionFits =
                        listDescription.length < LIST_DESCRIPTION_CHAR_LIMIT

                    let discordList: DiscordList | null = null
                    let slackList: SlackList | null = null
                    let isChatIntegrationSyncing = false

                    if (result.sharedList.platform === 'discord') {
                        discordList = await discord.findDiscordListForSharedList(
                            result.sharedList.reference,
                        )
                        if (!discordList) {
                            return {
                                mutation: { listData: { $set: undefined } },
                            }
                        }
                        isChatIntegrationSyncing = !!(await discordRetroSync.getSyncEntryByChannel(
                            { channelId: discordList.channelId },
                        ))
                    } else if (result.sharedList.platform === 'slack') {
                        slackList = await slack.findSlackListForSharedList(
                            result.sharedList.reference,
                        )
                        if (!slackList) {
                            return {
                                mutation: { listData: { $set: undefined } },
                            }
                        }
                        isChatIntegrationSyncing = !!(await slackRetroSync.getSyncEntryByChannel(
                            { channelId: slackList.channelId },
                        ))
                    }

                    this.mainListEntries.push(...result.entries)
                    this.emitMutation({
                        listData: {
                            $set: {
                                slackList,
                                reference: listReference,
                                pageSize: PAGE_SIZE,
                                discordList,
                                isChatIntegrationSyncing,
                                creatorReference: result.creator,
                                creator: await this._users.loadUser(
                                    result.creator,
                                ),
                                list: result.sharedList,
                                listEntries: result.entries,
                                listDescriptionState: listDescriptionFits
                                    ? 'fits'
                                    : 'collapsed',
                                listDescriptionTruncated: truncate(
                                    listDescription,
                                    LIST_DESCRIPTION_CHAR_LIMIT,
                                ),
                            },
                        },
                        isListOwner: {
                            $set:
                                result.creator.id ===
                                this.dependencies.services.auth.getCurrentUserReference()
                                    ?.id,
                        },
                        newPageReplies: {
                            $set: fromPairs(
                                result.entries.map((entry) => [
                                    entry.normalizedUrl,
                                    getInitialNewReplyState(),
                                ]),
                            ),
                        },
                    })
                } else {
                    this.emitMutation({ listData: { $set: undefined } })
                }
            },
        )
        this.emitSignal<CollectionDetailsSignal>({
            type: 'loaded-list-data',
            success: listDataSuccess,
        })
        const {
            success: annotationEntriesSuccess,
        } = await executeUITask<CollectionDetailsState>(
            this,
            'annotationEntriesLoadState',
            async () => {
                const entries = await contentSharing.getAnnotationListEntries({
                    listReference,
                })
                return {
                    mutation: {
                        annotationEntryData: { $set: entries },
                    },
                }
            },
        )
        this.emitSignal<CollectionDetailsSignal>({
            type: 'loaded-annotation-entries',
            success: annotationEntriesSuccess,
        })
    }

    private async loadFollowBtnState() {
        const { activityFollows } = this.dependencies.storage
        const { auth } = this.dependencies.services

        const userReference = auth.getCurrentUserReference()

        if (userReference == null) {
            return this.emitMutation({
                followLoadState: { $set: 'pristine' },
            })
        }

        await executeUITask<CollectionDetailsState>(
            this,
            'followLoadState',
            async () => {
                const isAlreadyFollowed = await activityFollows.isEntityFollowedByUser(
                    {
                        userReference,
                        collection: 'sharedList',
                        objectId: this.dependencies.listID,
                    },
                )

                this.emitMutation({
                    isCollectionFollowed: { $set: isAlreadyFollowed },
                    followLoadState: { $set: 'success' },
                })

                if (isAlreadyFollowed && this._creatorReference) {
                    const webMonetization = this.dependencies.services
                        .webMonetization
                    const paymentPointer = await webMonetization.getUserPaymentPointer(
                        this._creatorReference,
                    )
                    if (paymentPointer) {
                        webMonetization.initiatePayment(paymentPointer)
                    }
                }
            },
        )
    }

    toggleEmbedShareModalCopyText: EventHandler<'toggleEmbedShareModalCopyText'> = ({
        event,
    }) => {
        this.emitMutation({
            isEmbedShareModalCopyTextShown: { $set: event.embedOrLink },
        })

        setTimeout(() => {
            this.emitMutation({
                isEmbedShareModalCopyTextShown: { $set: '' },
            })
        }, 3000)
    }

    toggleListShareModal: EventHandler<'toggleListShareModal'> = () => {
        this.emitMutation({
            isListShareModalShown: { $apply: (shown) => !shown },
        })
    }
    toggleEmbedModal: EventHandler<'toggleEmbedModal'> = (incoming) => {
        this.emitMutation({
            renderEmbedModal: {
                $set: !incoming.previousState.renderEmbedModal,
            },
        })
    }

    toggleDescriptionTruncation: EventHandler<'toggleDescriptionTruncation'> = () => {
        const mutation: UIMutation<CollectionDetailsState> = {
            listData: {
                listDescriptionState: {
                    $apply: (state) =>
                        state === 'collapsed' ? 'expanded' : 'collapsed',
                },
            },
        }
        return mutation
    }

    togglePageAnnotations: EventHandler<'togglePageAnnotations'> = (
        incoming,
    ) => {
        const state = incoming.previousState
        const shouldBeExpanded = !state.pageAnnotationsExpanded[
            incoming.event.normalizedUrl
        ]
        const currentExpandedCount = Object.keys(state.pageAnnotationsExpanded)
            .length
        const nextExpandedCount =
            currentExpandedCount + (shouldBeExpanded ? 1 : -1)
        const allAnnotationExpanded =
            nextExpandedCount === state.listData!.listEntries.length

        const mutation: UIMutation<CollectionDetailsState> = {
            pageAnnotationsExpanded: shouldBeExpanded
                ? {
                      [incoming.event.normalizedUrl]: {
                          $set: true,
                      },
                  }
                : {
                      $unset: [incoming.event.normalizedUrl],
                  },
            allAnnotationExpanded: { $set: allAnnotationExpanded },
        }
        this.emitMutation(mutation)
        if (shouldBeExpanded) {
            this.loadPageAnnotations(state.annotationEntryData!, [
                incoming.event.normalizedUrl,
            ])
        }
    }

    toggleAllAnnotations: EventHandler<'toggleAllAnnotations'> = (incoming) => {
        const shouldBeExpanded = !incoming.previousState.allAnnotationExpanded
        const currentExpandedCount = Object.keys(
            incoming.previousState.pageAnnotationsExpanded,
        ).length

        if (shouldBeExpanded) {
            this.emitMutation({
                allAnnotationExpanded: { $set: true },
            })

            incoming.previousState.listData!.listEntries.map((entry) => {
                let hasAnnotations =
                    incoming.previousState.annotationEntryData &&
                    incoming.previousState.annotationEntryData[
                        entry.normalizedUrl
                    ]

                if (hasAnnotations) {
                    this.emitMutation({
                        pageAnnotationsExpanded: {
                            [entry.normalizedUrl]: { $set: true },
                        },
                    })
                }
            })
        } else {
            this.emitMutation({
                allAnnotationExpanded: { $set: false },
                pageAnnotationsExpanded: { $set: {} },
            })
        }
        const {
            latestPageSeenIndex,
            normalizedPageUrls,
        } = this.getFirstPagesWithoutLoadedAnnotations(incoming.previousState)
        this.mainLatestEntryIndex = latestPageSeenIndex
        this.loadPageAnnotations(
            incoming.previousState.annotationEntryData!,
            normalizedPageUrls,
        )
    }

    pageBreakpointHit: EventHandler<'pageBreakpointHit'> = async (incoming) => {
        const { listData } = incoming.previousState
        if (!listData) {
            return
        }
        this.emitMutation({
            paginateLoading: { $set: 'running' },
        })
        let newListEntries: CollectionDetailsListEntry[] = []
        if (!this.latestSearchRequest) {
            if (incoming.event.entryIndex < this.mainLatestEntryIndex) {
                return
            }
            this.mainLatestEntryIndex = incoming.event.entryIndex

            const listEntries = await this.dependencies.storage.contentSharing.getListEntriesByList(
                {
                    listReference: listData.reference,
                    from:
                        listData.listEntries[listData.listEntries.length - 1]
                            .updatedWhen,
                    limit: PAGE_SIZE,
                },
            )
            newListEntries = listEntries.map((entry) => ({
                ...entry,
                sourceUrl: entry.originalUrl,
                id: entry.reference.id,
            }))
            this.mainListEntries.push(...newListEntries)
        } else {
            const page =
                Math.floor(
                    (incoming.event.entryIndex + 1) /
                        incoming.previousState.listData!.pageSize,
                ) + 1
            if (page <= (this.latestSearchRequest.page ?? 0)) {
                return
            }
            this.latestSearchRequest.page = page
            const response = await this.dependencies.services.fullTextSearch.searchListEntries(
                this.latestSearchRequest,
            )
            newListEntries = response.sharedListEntries.map((entry) => ({
                ...entry,
                sourceUrl: entry.originalUrl,
                creator: { type: 'user-reference' as const, id: entry.creator },
            }))
        }
        const mutation: UIMutation<CollectionDetailsState> = {
            paginateLoading: { $set: 'success' },
            listData: {
                listEntries: {
                    $push: newListEntries,
                },
            },
        }
        this.emitMutation(mutation)
        this.loadPageAnnotations(
            this.withMutation(incoming.previousState, mutation)
                .annotationEntryData!,
            newListEntries.map((entry) => entry.normalizedUrl),
        )
        const usersToLoad = new Set<string | number>(
            newListEntries.map((entry) => entry.creator.id),
        )
        this._users.loadUsers(
            [...usersToLoad].map(
                (id): UserReference => ({
                    type: 'user-reference',
                    id,
                }),
            ),
        )
    }

    clickFollowBtn: EventHandler<'clickFollowBtn'> = async ({
        previousState,
        event,
    }) => {
        const {
            services: { auth, memexExtension },
            storage: { activityFollows },
            listID,
        } = this.dependencies
        let userReference = auth.getCurrentUserReference()

        if (previousState.listRoleID || previousState.isListOwner) {
            return
        }

        // TODO: figure out what to properly do here
        if (userReference === null) {
            const { result } = await auth.requestAuth()

            if (
                result.status !== 'authenticated' &&
                result.status !== 'registered-and-authenticated'
            ) {
                return
            }

            userReference = auth.getCurrentUserReference()!
        }

        const entityArgs = {
            userReference,
            objectId: listID,
            collection: 'sharedList',
        }

        await executeUITask<CollectionDetailsState>(
            this,
            'followLoadState',
            async () => {
                const isAlreadyFollowed = await activityFollows.isEntityFollowedByUser(
                    entityArgs,
                )
                const mutation: UIMutation<CollectionDetailsState> = {
                    isCollectionFollowed: { $set: !isAlreadyFollowed },
                }

                if (isAlreadyFollowed) {
                    await activityFollows.deleteFollow(entityArgs)
                    const indexToDelete = previousState.followedLists.findIndex(
                        (list) => list.reference.id === listID,
                    )
                    mutation.followedLists = { $splice: [[indexToDelete, 1]] }
                } else {
                    await activityFollows.storeFollow(entityArgs)
                    const { list } = previousState.listData!
                    mutation.followedLists = {
                        $push: [
                            {
                                title: list.title,
                                createdWhen: list.createdWhen,
                                updatedWhen: list.updatedWhen,
                                reference: {
                                    type: 'shared-list-reference',
                                    id: listID,
                                },
                            },
                        ],
                    }
                }

                this.emitMutation(mutation)
            },
        )

        if (event.pageToOpenPostFollow != null) {
            setTimeout(
                () => window.open(event.pageToOpenPostFollow, '_blank'),
                1000,
            )
        }
    }

    toggleMoreCollaborators: EventHandler<'toggleMoreCollaborators'> = (
        event,
    ) => {
        return {
            showMoreCollaborators: {
                $set: !event.previousState.showMoreCollaborators,
            },
        }
    }

    hideMoreCollaborators: EventHandler<'hideMoreCollaborators'> = () => {
        return { showMoreCollaborators: { $set: false } }
    }

    getFirstPagesWithoutLoadedAnnotations(state: CollectionDetailsState) {
        const normalizedPageUrls: string[] = []
        let latestPageSeenIndex = 0
        for (const [
            entryIndex,
            { normalizedUrl },
        ] of state
            .listData!.listEntries.slice(this.mainLatestEntryIndex)
            .entries()) {
            if (normalizedPageUrls.length >= PAGE_SIZE) {
                break
            }
            if (
                // state.annotationEntryData![normalizedUrl] &&
                !this.pageAnnotationPromises[normalizedUrl]
            ) {
                normalizedPageUrls.push(normalizedUrl)
            }
            latestPageSeenIndex = entryIndex
        }
        return { normalizedPageUrls, latestPageSeenIndex }
    }

    async loadPageAnnotations(
        annotationEntries: GetAnnotationListEntriesResult,
        normalizedPageUrls: string[],
    ) {
        this.emitSignal<CollectionDetailsSignal>({
            type: 'annotation-loading-started',
        })

        const toFetch: Array<{
            normalizedPageUrl: string
            sharedAnnotation: SharedAnnotationReference
        }> = flatten(
            normalizedPageUrls
                .filter(
                    (normalizedPageUrl) =>
                        !this.pageAnnotationPromises[normalizedPageUrl],
                )
                .map((normalizedPageUrl) =>
                    (annotationEntries[normalizedPageUrl] ?? []).map(
                        (entry) => ({
                            normalizedPageUrl,
                            sharedAnnotation: entry.sharedAnnotation,
                        }),
                    ),
                ),
        )

        const promisesByPage: {
            [normalizedUrl: string]: Promise<GetAnnotationsResult>[]
        } = {}
        const annotationChunks: Promise<GetAnnotationsResult>[] = []
        const { contentSharing } = this.dependencies.storage
        for (const entryChunk of chunk(toFetch, 10)) {
            const pageUrlsInChuck = new Set(
                entryChunk.map((entry) => entry.normalizedPageUrl),
            )
            const promise = contentSharing.getAnnotations({
                references: entryChunk.map((entry) => entry.sharedAnnotation),
            })
            for (const normalizedPageUrl of pageUrlsInChuck) {
                promisesByPage[normalizedPageUrl] =
                    promisesByPage[normalizedPageUrl] ?? []
                promisesByPage[normalizedPageUrl].push(promise)
            }
            annotationChunks.push(promise)
        }

        const usersToLoad = new Set<UserReference['id']>()
        for (const normalizedPageUrl in promisesByPage) {
            this.pageAnnotationPromises[normalizedPageUrl] = (async (
                normalizedPageUrl: string,
                pagePromises: Promise<GetAnnotationsResult>[],
            ) => {
                this.emitMutation({
                    annotationLoadStates: {
                        [normalizedPageUrl]: { $set: 'running' },
                    },
                })

                try {
                    const annotationChunks = await Promise.all(pagePromises)
                    const newAnnotations: CollectionDetailsState['annotations'] = {}
                    for (const annotationChunk of annotationChunks) {
                        for (const [annotationId, annotation] of Object.entries(
                            annotationChunk,
                        )) {
                            newAnnotations[annotationId] = annotation
                        }
                    }
                    for (const newAnnotation of Object.values(newAnnotations)) {
                        usersToLoad.add(newAnnotation.creator.id)
                    }

                    const mutation = {
                        annotationLoadStates: {
                            [normalizedPageUrl]: { $set: 'success' },
                        },
                        annotations: mapValues(
                            newAnnotations,
                            (newAnnotation) => ({ $set: newAnnotation }),
                        ),
                    }
                    this.emitMutation(mutation as any)
                } catch (e) {
                    this.emitMutation({
                        annotationLoadStates: {
                            [normalizedPageUrl]: { $set: 'error' },
                        },
                    })
                    console.error(e)
                }
            })(normalizedPageUrl, promisesByPage[normalizedPageUrl])
        }

        const annotationReferences = flatten(
            Object.values(annotationEntries),
        ).map((entry) => entry.sharedAnnotation)
        this.emitMutation({
            conversations: {
                $merge: getInitialAnnotationConversationStates(
                    annotationReferences.map(({ id }) => ({
                        linkId: id.toString(),
                    })),
                ),
            },
        })
        const conversationThreadPromise = detectAnnotationConversationThreads(
            this as any,
            {
                getThreadsForAnnotations: (...args) =>
                    this.dependencies.storage.contentConversations.getThreadsForAnnotations(
                        ...args,
                    ),
                annotationReferences,
                sharedListReference: {
                    type: 'shared-list-reference',
                    id: this.dependencies.listID,
                },
            },
        ).catch(console.error)
        intializeNewPageReplies(this as any, {
            normalizedPageUrls: [...normalizedPageUrls].filter(
                (normalizedPageUrl) =>
                    !this.conversationThreadPromises[normalizedPageUrl],
            ),
        })

        for (const normalizedPageUrl of normalizedPageUrls) {
            this.conversationThreadPromises[
                normalizedPageUrl
            ] = conversationThreadPromise
        }

        try {
            const result = await Promise.all([
                ...normalizedPageUrls.map(
                    (normalizedPageUrl) =>
                        this.pageAnnotationPromises[normalizedPageUrl],
                ),
                ...normalizedPageUrls.map(
                    (normalizedPageUrl) =>
                        this.conversationThreadPromises[normalizedPageUrl],
                ),
            ])
            await this._users.loadUsers(
                [...usersToLoad].map(
                    (id): UserReference => ({
                        type: 'user-reference',
                        id,
                    }),
                ),
            )
            this.emitSignal<CollectionDetailsSignal>({
                type: 'loaded-annotations',
                success: true,
            })
            return result
        } catch (e) {
            this.emitSignal<CollectionDetailsSignal>({
                type: 'loaded-annotations',
                success: false,
            })
            throw e
        }
    }
}
