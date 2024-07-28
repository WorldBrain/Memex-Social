import React from 'react'
import {
    mapValues,
    filterObject,
} from '@worldbrain/memex-common/lib/utils/iteration'
import {
    SharedListEntry,
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
    CollectionDetailsMessageEvents,
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
    extDetectionInitialState,
    extDetectionEventHandlers,
} from '../../../../ext-detection/ui/logic'
import { UserReference } from '../../../../user-management/types'
import type { DiscordList } from '@worldbrain/memex-common/lib/discord/types'
import type { SlackList } from '@worldbrain/memex-common/lib/slack/types'
import * as chrono from 'chrono-node'
import type { SharedListEntrySearchRequest } from '@worldbrain/memex-common/lib/content-sharing/search'
import type { PreparedThread } from '@worldbrain/memex-common/lib/content-conversations/storage/types'
import type { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'
import { EventEmitter } from 'events'
import {
    editableAnnotationsEventHandlers,
    editableAnnotationsInitialState,
} from '../../../../annotations/ui/logic'
import type { UploadStorageUtils } from '@worldbrain/memex-common/lib/personal-cloud/backend/translation-layer/storage-utils'
import { createPersonalCloudStorageUtils } from '@worldbrain/memex-common/lib/content-sharing/storage/utils'
import { LoggedOutAccessBox } from './space-access-box'
import { IdField } from '@worldbrain/memex-common/lib/storage/types'
import { isMemexPageAPdf } from '@worldbrain/memex-common/lib/page-indexing/utils'
import TypedEventEmitter from 'typed-emitter'
import { PromptURL } from '@worldbrain/memex-common/lib/summarization/types'
import getCleanTextFromHtml from '@worldbrain/memex-common/lib/annotations/html-to-clean-text'
import { sleepPromise } from '../../../../../utils/promises'

const truncate = require('truncate')
const LIST_DESCRIPTION_CHAR_LIMIT = 400

type EventHandler<
    EventName extends keyof CollectionDetailsEvent
> = UIEventHandler<CollectionDetailsState, CollectionDetailsEvent, EventName>

export default class CollectionDetailsLogic extends UILogic<
    CollectionDetailsState,
    CollectionDetailsEvent
> {
    public events = new EventEmitter() as TypedEventEmitter<CollectionDetailsMessageEvents>

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
            urlsToAddToSpace: [],
            textFieldValueState: '',
            importUrlDisplayMode: 'queued',
            actionBarSearchAndAddMode: null,
            showAIchat: true,
            collectionDetailsEvents: this.events,
            showStartImportButton: false,
            ...extDetectionInitialState(),
            ...editableAnnotationsInitialState(),
            ...annotationConversationInitialState(),
        }
    }

    init: EventHandler<'init'> = async (incoming) => {
        await this.processUIEvent('load', {
            ...incoming,
            event: { isUpdate: false },
        })
        let prompt = 'Summarize the key takeaways of the articles in this Space'
        this.events.emit('addSpaceLinksAndNotesToEditor', {
            prompt: prompt,
        })
        await this.processUIEvent('loadAIresults', {
            event: { prompt: prompt },
            previousState: incoming.previousState,
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
            // if (retrievedList.sharedList.platform === 'discord') {
            //     discordList = await this.dependencies.storage.discord.findDiscordListForSharedList(
            //         retrievedList.sharedList.reference,
            //     )
            //     if (!discordList) {
            //         return {
            //             mutation: { listData: { $set: undefined } },
            //         }
            //     }
            //     isChatIntegrationSyncing = !!(await this.dependencies.storage.discordRetroSync.getSyncEntryByChannel(
            //         { channelId: discordList.channelId },
            //     ))
            // } else if (retrievedList.sharedList.platform === 'slack') {
            //     slackList = await this.dependencies.storage.slack.findSlackListForSharedList(
            //         retrievedList.sharedList.reference,
            //     )
            //     if (!slackList) {
            //         return {
            //             mutation: { listData: { $set: undefined } },
            //         }
            //     }
            //     isChatIntegrationSyncing = !!(await this.dependencies.storage.slackRetroSync.getSyncEntryByChannel(
            //         { channelId: slackList.channelId },
            //     ))
            // }
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

            const baseListRoles =
                data.rolesByList[this.dependencies.listID] ?? []
            const isAuthenticated = !!userReference
            const isContributor =
                (userReference &&
                    baseListRoles.find(
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
                ...new Set([
                    ...data.usersToLoad.map(
                        (id) =>
                            ({ type: 'user-reference', id } as UserReference),
                    ),
                    ...baseListRoles.map((role) => role.user),
                ]),
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
                listRoles: { $set: baseListRoles },
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
    toggleAIchat: EventHandler<'setPageHover'> = ({ previousState }) => {
        this.emitMutation({
            showAIchat: { $set: !previousState.showAIchat },
        })
    }
    loadAIresults: EventHandler<'loadAIresults'> = async ({
        event,
        previousState,
    }) => {
        const prompt = event.prompt

        // Load all links:
        const response = await this.dependencies.services.contentSharing.backend.loadCollectionDetails(
            {
                listId: this.dependencies.listID,
            },
        )
        const { data } = response
        const entries = data.retrievedList.entries
        const normalizedPageUrls = entries.map((entry) => entry.normalizedUrl)
        const originalUrls = entries.map((entry) => entry.originalUrl)
        const annotationEntries = data.annotationEntries

        const annotationsResult = await this.dependencies.services.contentSharing.backend.loadAnnotationsWithThreads(
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
        const annotationsData = annotationsResult.data.annotations
        const replyData = annotationsResult.data.threads

        // Construct the SpaceContent object
        const contentList: PromptURL[] = entries.map((item, index: number) => {
            const url = item.originalUrl
            const title = item.pageData?.title ?? null
            const originalText = null
            const notes =
                Object.values(annotationsData)?.map((annotation) => {
                    const highlightText =
                        annotation.body && getCleanTextFromHtml(annotation.body)
                    const commentText =
                        annotation.comment &&
                        getCleanTextFromHtml(annotation.comment)

                    return {
                        id: annotation.linkId,
                        highlightedText: highlightText,
                        commentText: commentText,
                        // replies:
                        //     replyData[annotation.linkId]?.map((thread) => ({
                        //         id: thread.id,
                        //         replyText: thread.text,
                        //     })) || [],
                    }
                }) || []
            return {
                url,
                title,
                originalText,
                notes,
            }
        })

        this.emitMutation({
            contentList: { $set: contentList },
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
        this.events.emit('addPageUrlToEditor', {
            url: incoming.event.entry.sourceUrl,
            title: incoming.event.entry.title,
            prompt:
                'Summarize this content for me in 2 sentences without saying things like "here is a summery". Be descriptive',
            instaExecutePrompt: true,
        })
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

    updateAddLinkField: EventHandler<'updateAddLinkField'> = async ({
        previousState,
        event,
    }) => {
        const text = event.textFieldValue
        this.emitMutation({
            textFieldValueState: { $set: text },
        })
        let existingUrls: {
            url: string
            status: 'success' | 'queued' | 'input' | 'adding' | 'failed'
        }[] = []

        const urls =
            text.match(
                /(\b(https?|http):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi,
            ) || []

        for (let url of urls) {
            const urlToAdd = url
                ? { url: url, status: 'queued' as const }
                : null

            if (
                urlToAdd &&
                !existingUrls.some(
                    (existingUrl) => existingUrl.url === urlToAdd.url,
                )
            ) {
                existingUrls.push(urlToAdd)
            }
        }

        // Example mutation to update state with extracted URLs
        this.emitMutation({
            urlsToAddToSpace: { $set: existingUrls },
            showStartImportButton: { $set: true },
        })
    }

    removeLinkFromImporterQueue: EventHandler<'removeLinkFromImporterQueue'> = async ({
        previousState,
        event,
    }) => {
        const { urlsToAddToSpace } = previousState
        const url = event
        const urlIndex = urlsToAddToSpace.findIndex(
            (urlToAdd) => urlToAdd.url === url,
        )
        if (urlIndex === -1) {
            return
        }
        urlsToAddToSpace.splice(urlIndex, 1)
        this.emitMutation({
            urlsToAddToSpace: { $set: urlsToAddToSpace },
        })
    }

    setActionBarSearchAndAddMode: EventHandler<'setActionBarSearchAndAddMode'> = async ({
        previousState,
        event,
    }) => {
        this.emitMutation({
            actionBarSearchAndAddMode: { $set: event },
        })
    }
    addLinkToCollection: EventHandler<'addLinkToCollection'> = async ({
        previousState,
        event,
    }) => {
        const { urlsToAddToSpace } = previousState
        const { contentSharing } = this.dependencies.services

        this.emitMutation({
            showStartImportButton: { $set: false },
        })

        let existingListEntries = previousState.listData?.listEntries ?? []

        for (let item in urlsToAddToSpace) {
            const url = urlsToAddToSpace[item].url

            this.emitMutation({
                urlsToAddToSpace: {
                    [item]: {
                        status: { $set: 'running' },
                    },
                },
            })

            try {
                const addedEntry = await contentSharing.backend.addRemoteUrlsToList(
                    {
                        listReference: {
                            id: this.dependencies.listID,
                            type: 'shared-list-reference',
                        },
                        fullPageUrls: [url],
                    },
                )

                if (addedEntry) {
                    const newCollectionEntry: CollectionDetailsListEntry = {
                        ...addedEntry[url],
                        creator: {
                            type: 'user-reference',
                            id: previousState.currentUserReference?.id ?? '',
                        },
                        sourceUrl: addedEntry[url]?.originalUrl,
                        updatedWhen: addedEntry[url]?.createdWhen,
                        reference: {
                            id: addedEntry[url]?.id,
                            type: 'shared-list-entry-reference',
                        },
                    }

                    const hasData = newCollectionEntry.normalizedUrl != null

                    if (hasData) {
                        existingListEntries?.unshift(newCollectionEntry)

                        this.emitMutation({
                            listData: {
                                listEntries: { $set: existingListEntries },
                            },
                        })
                    }
                    this.emitMutation({
                        urlsToAddToSpace: {
                            [item]: {
                                status: { $set: 'success' },
                            },
                        },
                    })
                }
            } catch (e) {
                this.emitMutation({
                    urlsToAddToSpace: {
                        [item]: {
                            status: { $set: 'failed' },
                        },
                    },
                })
            }
        }
    }

    switchImportUrlDisplayMode: EventHandler<'switchImportUrlDisplayMode'> = async ({
        previousState,
        event,
    }) => {
        this.emitMutation({
            importUrlDisplayMode: { $set: event },
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
                } else {
                    await activityFollows.storeFollow(entityArgs)
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
    openImageInPreview: EventHandler<'openImageInPreview'> = ({ event }) => {
        this.emitMutation({
            imageSourceForPreview: { $set: event.imageSource },
        })
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
