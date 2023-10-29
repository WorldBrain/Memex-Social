import React from 'react'
import {
    mapValues,
    filterObject,
} from '@worldbrain/memex-common/lib/utils/iteration'
import {
    SharedListReference,
    SharedListRoleID,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import {
    GetAnnotationListEntriesElement,
    GetAnnotationsResult,
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
import { PAGE_SIZE } from './constants'
import {
    annotationConversationInitialState,
    annotationConversationEventHandlers,
    detectAnnotationConversationThreads,
    setupConversationLogicDeps,
    intializeNewPageReplies,
} from '../../../../content-conversations/ui/logic'
import { getInitialNewReplyState } from '../../../../content-conversations/ui/utils'
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
import type { PreparedThread } from '@worldbrain/memex-common/lib/content-conversations/storage/types'
import type { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'
import {
    editableAnnotationsEventHandlers,
    editableAnnotationsInitialState,
} from '../../../../annotations/ui/logic'
import type { UploadStorageUtils } from '@worldbrain/memex-common/lib/personal-cloud/backend/translation-layer/storage-utils'
import { createPersonalCloudStorageUtils } from '@worldbrain/memex-common/lib/content-sharing/storage/utils'
import { LoggedOutAccessBox } from './space-access-box'
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
    /**
     * This is only used as a way to create sync entries when we update annotation comments here.
     * TODO: Possibly move this to a storage hook.
     */
    private personalCloudStorageUtils: UploadStorageUtils | null = null

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
            editableAnnotationsEventHandlers<CollectionDetailsState>(
                this as any,
                {
                    ...this.dependencies,
                    getPersonalCloudStorageUtils: () =>
                        this.personalCloudStorageUtils,
                },
            ),
        )

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
                            annotationEditStates: {
                                [annotation.linkId]: {
                                    $set: {
                                        isEditing: false,
                                        loadState: 'pristine',
                                        comment: annotation.comment ?? '',
                                    },
                                },
                            },
                            annotationHoverStates: {
                                [annotation.linkId]: {
                                    $set: {
                                        isHovering: false,
                                    },
                                },
                            },
                            annotationDeleteStates: {
                                [annotation.linkId]: {
                                    $set: {
                                        isDeleting: false,
                                        deleteState: 'pristine',
                                    },
                                },
                            },
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
            followLoadState: 'pristine',
            permissionKeyState: 'pristine',
            // listRolesLoadState: 'pristine',
            listRoles: [],
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
            ...editableAnnotationsInitialState(),
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

        const keyString = !incoming.event.isUpdate
            ? this.dependencies.services.listKeys.getCurrentKey()
            : null
        await executeUITask(this, 'listLoadState', async () => {
            const response = await this.dependencies.services.contentSharing.backend.loadCollectionDetails(
                {
                    listId: this.dependencies.listID,
                },
            )
            if (response.status !== 'success') {
                if (response.status === 'permission-denied') {
                    await this._users.loadUser({
                        type: 'user-reference',
                        id: response.data.creator,
                    })
                    const permissionDeniedData = {
                        ...response.data,
                        hasKey: !!keyString,
                    }
                    this.emitMutation({
                        listRoles: { $set: [] },
                        permissionDenied: { $set: permissionDeniedData },
                    })
                    const { auth } = this.dependencies.services
                    const currentUser = auth.getCurrentUser()
                    if (!currentUser) {
                        await auth.requestAuth({
                            header: (
                                <LoggedOutAccessBox
                                    keyString={keyString}
                                    permissionDenied={permissionDeniedData}
                                />
                            ),
                        })
                        this.processUIEvent('load', {
                            event: { isUpdate: false },
                            previousState: incoming.previousState,
                        })
                    }
                }
                return
            }
            const { data } = response
            const { retrievedList } = data

            const listDescription = retrievedList.sharedList.description ?? ''
            const listDescriptionFits =
                listDescription.length < LIST_DESCRIPTION_CHAR_LIMIT
            let discordList: DiscordList | null = null
            let slackList: SlackList | null = null
            let isChatIntegrationSyncing = false
            if (retrievedList.sharedList.platform === 'discord') {
                discordList = await this.dependencies.storage.discord.findDiscordListForSharedList(
                    retrievedList.sharedList.reference,
                )
                if (!discordList) {
                    return {
                        mutation: { listData: { $set: undefined } },
                    }
                }
                isChatIntegrationSyncing = !!(await this.dependencies.storage.discordRetroSync.getSyncEntryByChannel(
                    { channelId: discordList.channelId },
                ))
            } else if (retrievedList.sharedList.platform === 'slack') {
                slackList = await this.dependencies.storage.slack.findSlackListForSharedList(
                    retrievedList.sharedList.reference,
                )
                if (!slackList) {
                    return {
                        mutation: { listData: { $set: undefined } },
                    }
                }
                isChatIntegrationSyncing = !!(await this.dependencies.storage.slackRetroSync.getSyncEntryByChannel(
                    { channelId: slackList.channelId },
                ))
            }
            this.mainListEntries.push(...retrievedList.entries)

            await this.dependencies.services.auth.waitForAuthReady()
            const userReference = this.dependencies.services.auth.getCurrentUserReference()
            if (userReference) {
                this.personalCloudStorageUtils = await createPersonalCloudStorageUtils(
                    {
                        userId: userReference.id,
                        storageManager: this.dependencies.storageManager,
                    },
                )
            }

            const isAuthenticated = !!userReference
            const isContributor =
                (userReference &&
                    data.listRoles.find(
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

            const loadedUsers = await this._users.loadUsers([
                retrievedList.creator,
                ...data.usersToLoad.map(
                    (id) => ({ type: 'user-reference', id } as UserReference),
                ),
            ])

            this.emitMutation({
                currentUserReference: { $set: userReference },
                listData: {
                    $set: {
                        slackList,
                        reference: retrievedList.sharedList.reference,
                        pageSize: PAGE_SIZE,
                        discordList,
                        isChatIntegrationSyncing,
                        creatorReference: data.retrievedList.creator,
                        creator: loadedUsers[retrievedList.creator.id],
                        list: retrievedList.sharedList,
                        listEntries: retrievedList.entries,
                        listDescriptionState: listDescriptionFits
                            ? 'fits'
                            : 'collapsed',
                        listDescriptionTruncated: truncate(
                            listDescription,
                            LIST_DESCRIPTION_CHAR_LIMIT,
                        ),
                    },
                },
                listRoles: { $set: data.listRoles },
                isListOwner: {
                    $set: retrievedList.creator.id === userReference?.id,
                },
                newPageReplies: {
                    $set: Object.fromEntries(
                        retrievedList.entries.map((entry) => [
                            entry.normalizedUrl,
                            getInitialNewReplyState(),
                        ]),
                    ),
                },
                annotationEntriesLoadState: { $set: 'success' },
                annotationEntryData: { $set: data.annotationEntries },
            })

            if (this.dependencies.entryID) {
                const normalizedPageUrl = retrievedList.entries[0].normalizedUrl
                this.emitMutation({
                    pageAnnotationsExpanded: {
                        [normalizedPageUrl]: { $set: true },
                    },
                })
                await this.initializePageAnnotations(
                    // data.usersToLoad,
                    data.annotations!,
                    data.threads,
                )
            }
        })
        await this.loadFollowBtnState()
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
                this.emitMutation({
                    showDeniedNote: { $set: false },
                })

                if (incoming.previousState.permissionDenied) {
                    await this.processUIEvent('load', {
                        event: { isUpdate: false },
                        previousState: incoming.previousState,
                    })
                }

                await this.dependencies.services.auth.waitForAuthReady()

                let userReference = this.dependencies.services.auth.getCurrentUserReference()!
                const successMutation: UIMutation<CollectionDetailsState> = {
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
                    permissionDenied: { $set: undefined },
                }

                const {
                    result,
                } = await this.dependencies.services.listKeys.processCurrentKey()

                if (result !== 'not-authenticated') {
                    if (result === 'denied') {
                        this.emitMutation({
                            permissionKeyResult: { $set: result },
                            requestingAuth: { $set: false },
                            showDeniedNote: { $set: true },
                        })

                        return
                    }

                    await this._users.loadUser(userReference)
                    this.emitMutation({
                        permissionKeyResult: { $set: result },
                        requestingAuth: { $set: false },
                        ...(result === 'success' ? successMutation : {}),
                    })
                    if (incoming.previousState.permissionDenied) {
                        this.processUIEvent('load', {
                            event: { isUpdate: false },
                            previousState: incoming.previousState,
                        })
                    }

                    return
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
                }

                const {
                    result: secondKeyResult,
                } = await this.dependencies.services.listKeys.processCurrentKey()

                userReference = this.dependencies.services.auth.getCurrentUserReference()!
                await this._users.loadUser(userReference)

                this.emitMutation({
                    permissionKeyResult: { $set: secondKeyResult },
                    requestingAuth: { $set: false },
                    ...successMutation,
                })

                if (incoming.previousState.permissionDenied) {
                    this.processUIEvent('load', {
                        event: { isUpdate: false },
                        previousState: incoming.previousState,
                    })
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
            })
        } else {
            this.emitMutation({ listData: { $set: undefined } })
        }
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

    togglePageAnnotations: EventHandler<'togglePageAnnotations'> = async (
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
        if (!shouldBeExpanded) {
            return
        }
        this.loadPageAnnotations(state, [incoming.event.normalizedUrl])
    }

    toggleAllAnnotations: EventHandler<'toggleAllAnnotations'> = (incoming) => {
        const shouldBeExpanded = !incoming.previousState.allAnnotationExpanded
        // const currentExpandedCount = Object.keys(
        //     incoming.previousState.pageAnnotationsExpanded,
        // ).length
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
        this.loadPageAnnotations(incoming.previousState, normalizedPageUrls)
    }

    pageBreakpointHit: EventHandler<'pageBreakpointHit'> = async (incoming) => {
        const { listData } = incoming.previousState
        if (!listData) {
            return
        }
        await executeUITask(this, 'paginateLoading', async () => {
            let newListEntries: CollectionDetailsListEntry[] = []
            if (!this.latestSearchRequest) {
                if (incoming.event.entryIndex < this.mainLatestEntryIndex) {
                    return
                }
                this.mainLatestEntryIndex = incoming.event.entryIndex

                const pageResult = await this.dependencies.services.contentSharing.backend.loadCollectionDetailsPage(
                    {
                        listId: listData.reference.id,
                        from:
                            listData.listEntries[
                                listData.listEntries.length - 1
                            ].updatedWhen,
                    },
                )
                if (pageResult.status !== 'success') {
                    throw new Error(
                        `Expected 'success' status loading collection details page, but got '${pageResult.status}'`,
                    )
                }
                const listEntries = pageResult.data.entries
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
                    creator: {
                        type: 'user-reference' as const,
                        id: entry.creator,
                    },
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
                this.withMutation(incoming.previousState, mutation),
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
        })
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
        previousState: CollectionDetailsState,
        normalizedPageUrls: string[],
    ) {
        const { contentSharing } = this.dependencies.services

        const annotationEntries = previousState.annotationEntryData!
        this.emitSignal<CollectionDetailsSignal>({
            type: 'annotation-loading-started',
        })

        const pristinePageUrls = normalizedPageUrls.filter(
            (url) => !previousState.annotationLoadStates[url],
        )
        const taskStatesMutation = (
            taskState: UITaskState,
        ): UIMutation<CollectionDetailsState> => ({
            annotationLoadStates: Object.fromEntries(
                pristinePageUrls.map((url) => [url, { $set: taskState }]),
            ),
        })
        await executeUITask(this, taskStatesMutation, async () => {
            const annotationsResult = await contentSharing.backend.loadAnnotationsWithThreads(
                {
                    listId: this.dependencies.listID,
                    annotationIds: filterObject(
                        mapValues(annotationEntries, (entries) =>
                            entries.map((entry) => entry.sharedAnnotation.id),
                        ),
                        (_, key) => normalizedPageUrls.includes(key),
                    ),
                },
            )
            if (annotationsResult.status !== 'success') {
                return
            }
            const annotationsData = annotationsResult.data
            await this.initializePageAnnotations(
                annotationsData.annotations,
                annotationsData.threads,
            )

            const annotationLoadStates: UIMutation<
                CollectionDetailsState['annotationLoadStates']
            > = {}
            const annotations: UIMutation<
                CollectionDetailsState['annotations']
            > = {}
            for (const [normalizedPageUrl, newAnnotations] of Object.entries(
                annotationsData.annotations,
            )) {
                annotationLoadStates[normalizedPageUrl] = {
                    $set: 'success',
                }
                annotations[normalizedPageUrl] = { $set: newAnnotations }
            }
            this.emitMutation({
                annotationLoadStates,
                annotations,
                annotationEditStates: mapValues(
                    annotationsData.annotations,
                    (annotation) => ({
                        $set: {
                            isEditing: false,
                            loadState: 'pristine',
                            comment: annotation.comment ?? '',
                        },
                    }),
                ) as any,
                annotationHoverStates: mapValues(
                    annotationsData.annotations,
                    (annotation) => ({
                        $set: { isHovering: false },
                    }),
                ),
                annotationDeleteStates: mapValues(
                    annotationsData.annotations,
                    (annotation) => ({
                        $set: {
                            isDeleting: false,
                            deleteState: 'pristine',
                        },
                    }),
                ) as any,
            })

            await this._users.loadUsers(
                annotationsData.usersToLoad.map(
                    (id): UserReference => ({
                        type: 'user-reference',
                        id,
                    }),
                ),
            )
        })
    }

    async initializePageAnnotations(
        // usersToLoad: AutoPk[],
        annotations: GetAnnotationsResult,
        threads?: PreparedThread[],
    ) {
        // await this._users.loadUsers(
        //     usersToLoad.map(
        //         (id): UserReference => ({
        //             type: 'user-reference',
        //             id,
        //         }),
        //     ),
        // )
        if (threads) {
            await detectAnnotationConversationThreads(this as any, {
                threads,
                getThreadsForAnnotations: (...args) =>
                    this.dependencies.storage.contentConversations.getThreadsForAnnotations(
                        ...args,
                    ),
                annotationReferences: Object.values(annotations).map(
                    (annotation) => annotation.reference,
                ),
                sharedListReference: {
                    type: 'shared-list-reference',
                    id: this.dependencies.listID,
                },
                imageSupport: this.dependencies.imageSupport,
            })
        }
        intializeNewPageReplies(this as any, {
            normalizedPageUrls: [
                ...Object.values(annotations).map(
                    (annotation) => annotation.normalizedPageUrl,
                ),
            ],
            imageSupport: this.dependencies.imageSupport,
            // .filter(
            //     (normalizedPageUrl) =>
            //         !this.conversationThreadPromises[normalizedPageUrl],
            // ),
        })
    }
}
