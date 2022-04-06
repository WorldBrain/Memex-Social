import sortBy from 'lodash/sortBy'
import orderBy from 'lodash/orderBy'
import {
    ActivityStreamResultGroup,
    ActivityStream,
} from '@worldbrain/memex-common/lib/activity-streams/types'
import {
    UILogic,
    UIEventHandler,
    loadInitial,
    executeUITask,
    UIMutation,
} from '../../../../../main-ui/classes/logic'
import {
    HomeFeedEvent,
    HomeFeedDependencies,
    HomeFeedState,
    PageActivityItem,
    AnnotationActivityItem,
    ActivityItem,
    ActivityData,
    ListEntryActivityItem,
    ListActivityItem,
} from './types'
import {
    getInitialAnnotationConversationStates,
    getInitialNewReplyState,
} from '../../../../content-conversations/ui/utils'
import {
    annotationConversationInitialState,
    annotationConversationEventHandlers,
    setupConversationLogicDeps,
} from '../../../../content-conversations/ui/logic'
import {
    listsSidebarInitialState,
    listsSidebarEventHandlers,
} from '../../../../lists-sidebar/ui/logic'
import UserProfileCache from '../../../../user-management/utils/user-profile-cache'
import { AnnotationConversationState } from '../../../../content-conversations/ui/types'
import {
    createOrderedMap,
    arrayToOrderedMap,
    OrderedMap,
} from '../../../../../utils/ordered-map'
import {
    User,
    UserReference,
} from '@worldbrain/memex-common/lib/web-interface/types/users'
import {
    SharedAnnotationReference,
    SharedListReference,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import {
    extDetectionInitialState,
    extDetectionEventHandlers,
} from '../../../../ext-detection/ui/logic'
import { UITaskState } from '../../../../../main-ui/types'

type EventHandler<EventName extends keyof HomeFeedEvent> = UIEventHandler<
    HomeFeedState,
    HomeFeedEvent,
    EventName
>

export default class HomeFeedLogic extends UILogic<
    HomeFeedState,
    HomeFeedEvent
> {
    pageSize = 50
    itemOffset = 0
    hasMore = true
    users: UserProfileCache

    constructor(private dependencies: HomeFeedDependencies) {
        super()

        this.users = new UserProfileCache({
            ...dependencies,
            onUsersLoad: (users) => {
                this.emitMutation({ users: { $merge: users } })
            },
        })

        Object.assign(
            this,
            annotationConversationEventHandlers<HomeFeedState>(this as any, {
                ...setupConversationLogicDeps(this.dependencies),
                // TODO: see if this needs to be brought back in (likely lost in memex-common merging)
                // getSharedListReference: (params) => {
                //     const { groupId } = splitConversationKey(
                //         params.conversationId,
                //     )
                //     const activityItem = findActivityItem(
                //         params.state.activityItems,
                //         groupId,
                //     )
                //     if (!activityItem) {
                //         throw new Error(
                //             `Could not save reply: can't find activity item`,
                //         )
                //     }
                //     return activityItem.listReference
                // },
                selectAnnotationData: (state, reference) => {
                    const annotation = state.annotations[reference.id]
                    if (!annotation) {
                        return null
                    }
                    return {
                        normalizedPageUrl: annotation.normalizedPageUrl,
                        pageCreatorReference: annotation.creatorReference,
                    }
                },
                loadUserByReference: (reference) =>
                    this.users.loadUser(reference),
            }),
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

    getInitialState(): HomeFeedState {
        return {
            loadState: 'pristine',
            activityItems: createOrderedMap(),
            pageInfo: {},
            annotations: {},
            replies: {},
            users: {},
            shouldShowNewLine: true,
            moreRepliesLoadStates: {},
            ...extDetectionInitialState(),
            ...listsSidebarInitialState(),
            ...annotationConversationInitialState(),
        }
    }

    init: EventHandler<'init'> = async ({ previousState, event }) => {
        const authEnforced = await this.dependencies.services.auth.enforceAuth({
            reason: 'login-requested',
        })
        if (!authEnforced) {
            this.emitMutation({ needsAuth: { $set: true } })
            await this.dependencies.services.auth.waitForAuth()
            this.emitMutation({ needsAuth: { $set: false } })
        }
        const userReference = this.dependencies.services.auth.getCurrentUserReference()
        if (!userReference) {
            // Firebase auth doesn't immediately detect authenticated users, so wait if needed
            await new Promise((resolve) => {
                this.dependencies.services.auth.events.once('changed', () => {
                    resolve()
                })
            })
        }
        await this.loadNextActivities(previousState, { isInitial: true })
        await this.processUIEvent('initActivityFollows', {
            previousState,
            event,
        })
    }

    getLastSeenLinePosition: EventHandler<'getLastSeenLinePosition'> = async ({
        previousState,
    }) => {
        const lastSeenLineID = document.getElementById('lastSeenLine')

        if (lastSeenLineID) {
            const seenLinePosition = Array.from(
                lastSeenLineID?.parentNode?.children ?? [],
            ).indexOf(lastSeenLineID)
            if (seenLinePosition === 1) {
                this.emitMutation({ shouldShowNewLine: { $set: false } })
            }
        }
    }

    waypointHit: EventHandler<'waypointHit'> = async ({ previousState }) => {
        if (this.hasMore) {
            await this.loadNextActivities(previousState)
        }
    }

    toggleListEntryActivityAnnotations: EventHandler<'toggleListEntryActivityAnnotations'> = async ({
        event,
        previousState,
    }) => {
        const list = previousState.activityItems.items[
            event.listReference.id
        ] as ListActivityItem
        const entry = list.entries.items[event.listEntryReference.id]

        // Things have already been loaded earlier, so just toggle the show state
        if (entry.annotationsLoadState !== 'pristine') {
            this.emitMutation({
                activityItems: {
                    items: {
                        [event.listReference.id]: {
                            entries: {
                                items: {
                                    [event.listEntryReference.id]: {
                                        areAnnotationsShown: {
                                            $set: !entry.areAnnotationsShown,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            })
            return
        }

        await executeUITask<HomeFeedState>(
            this,
            (taskState) => ({
                activityItems: {
                    items: {
                        [event.listReference.id]: {
                            entries: {
                                items: {
                                    [event.listEntryReference.id]: {
                                        annotationsLoadState: {
                                            $set: taskState,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            }),
            async () => {
                const {
                    contentSharing,
                    contentConversations,
                } = this.dependencies.storage

                const annotations = await contentSharing.getAnnotationsByCreatorAndPageUrl(
                    {
                        normalizedPageUrl: entry.normalizedUrl,
                        creatorReference: entry.creator,
                    },
                )
                const repliesByAnnotation = await contentConversations.getRepliesByAnnotations(
                    {
                        sharedListReference: event.listReference,
                        annotationReferences: annotations.map(
                            (annotation) => annotation.reference,
                        ),
                    },
                )

                const annotationItems: AnnotationActivityItem[] = annotations.map(
                    (annotation) => ({
                        type: 'annotation-item',
                        reference: annotation.reference,
                        hasEarlierReplies: false,
                        replies: (
                            repliesByAnnotation[annotation.reference.id] ?? []
                        ).map((reply) => ({ reference: reply.reference })),
                    }),
                )

                const annotationsData: ActivityData['annotations'] = {}
                const repliesData: ActivityData['replies'] = {}

                for (const annotation of annotations) {
                    annotationsData[annotation.reference.id] = {
                        ...annotation,
                        creatorReference: annotation.creator,
                        linkId: annotation.reference.id as string,
                    }
                }

                const loadedUsers: { [id: string]: User } = {}
                for (const result of await Promise.all(
                    annotations.map(async (annotation) => [
                        annotation.creator,
                        await this.users.loadUser(annotation.creator),
                    ]),
                )) {
                    const userReference = result[0] as UserReference
                    const user = result[1] as User | null
                    if (user) {
                        loadedUsers[userReference.id] = user
                    }
                }

                for (const [annotationId, replies] of Object.entries(
                    repliesByAnnotation,
                )) {
                    const annotationReference: SharedAnnotationReference = {
                        type: 'shared-annotation-reference',
                        id: annotationId,
                    }
                    const conversationKey = getConversationKey({
                        groupId: event.groupId,
                        annotationReference,
                    })

                    repliesData[conversationKey] =
                        repliesData[event.groupId] ?? {}
                    for (const replyData of replies) {
                        repliesData[conversationKey][replyData.reference.id] = {
                            creatorReference: replyData.userReference,
                            reference: replyData.reference,
                            previousReplyReference: replyData.previousReply,
                            reply: {
                                content: replyData.reply.content,
                                createdWhen: replyData.reply.createdWhen,
                                normalizedPageUrl:
                                    replyData.reply.normalizedPageUrl,
                            },
                        }
                    }
                }

                const conversationsData: HomeFeedState['conversations'] = {}
                for (const annotation of Object.values(annotations)) {
                    const conversationKey = getConversationKey({
                        groupId: event.groupId,
                        annotationReference: annotation.reference,
                    })
                    conversationsData[conversationKey] = {
                        loadState: 'success',
                        hasThreadLoadLoadState: 'success',
                        expanded: false,
                        newReply: getInitialNewReplyState(),
                        replies: await Promise.all(
                            Object.values(
                                repliesData[conversationKey] ?? [],
                            ).map(async (reply) => ({
                                reference: reply.reference,
                                reply: reply.reply,
                                user: await this.users.loadUser(
                                    reply.creatorReference,
                                ),
                            })),
                        ),
                    }
                }

                this.emitMutation({
                    replies: { $merge: repliesData },
                    annotations: { $merge: annotationsData },
                    conversations: { $merge: conversationsData },
                    activityItems: {
                        items: {
                            [event.listReference.id]: {
                                entries: {
                                    items: {
                                        [event.listEntryReference.id]: {
                                            areAnnotationsShown: {
                                                $set: !entry.areAnnotationsShown,
                                            },
                                            annotations: {
                                                $set: arrayToOrderedMap(
                                                    annotationItems,
                                                    (item) =>
                                                        getConversationKey({
                                                            groupId:
                                                                event.groupId,
                                                            annotationReference:
                                                                item.reference,
                                                        }),
                                                ),
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    users: { $merge: loadedUsers },
                })
            },
        )
    }

    loadMoreReplies: EventHandler<'loadMoreReplies'> = async (incoming) => {
        const { groupId, annotationReference, listReference } = incoming.event
        const conversationKey = getConversationKey({
            groupId,
            annotationReference,
        })

        await executeUITask<HomeFeedState>(
            this,
            (taskState) => ({
                moreRepliesLoadStates: {
                    [conversationKey]: { $set: taskState },
                },
            }),
            async () => {
                const rep = await this.dependencies.storage.contentConversations.getRepliesByAnnotation(
                    {
                        annotationReference,
                        sharedListReference: listReference,
                    },
                )
                const replies = rep.filter(
                    (replyData) =>
                        // don't process already loaded replies
                        !incoming.previousState.replies[conversationKey][
                            replyData.reference.id
                        ],
                )

                const repliesWithUsers = await Promise.all(
                    replies.map(async (replyData) => ({
                        reference: replyData.reference,
                        user: await this.users.loadUser(
                            replyData.userReference,
                        ),
                        reply: replyData.reply,
                    })),
                )

                const conversationsMutations: UIMutation<
                    HomeFeedState['conversations']
                > = {
                    [conversationKey]: {
                        replies: {
                            $apply: (
                                prevReplies: AnnotationConversationState['replies'], // TODO: Why aren't $apply ops getting typed?A
                            ) =>
                                [...prevReplies, ...repliesWithUsers].sort(
                                    (a, b) =>
                                        a.reply.createdWhen -
                                        b.reply.createdWhen,
                                ),
                        },
                    },
                }

                const repliesMutation: UIMutation<HomeFeedState['replies']> = {}
                for (const replyData of replies) {
                    repliesMutation[conversationKey] =
                        repliesMutation[conversationKey] ?? {}
                    repliesMutation[conversationKey] = {
                        ...repliesMutation[conversationKey],
                        [replyData.reference.id]: {
                            $set: {
                                reference: replyData.reference,
                                previousReplyReference: replyData.previousReply,
                                creatorReference: replyData.userReference,
                                reply: replyData.reply,
                            },
                        },
                    }
                }

                return {
                    mutation: {
                        conversations: conversationsMutations,
                        replies: repliesMutation,
                    },
                }
            },
        )
    }

    private async checkAnnotationsExistForActivityItems({
        activityItems,
    }: HomeFeedState) {
        for (const activityItemKey of activityItems.order) {
            const activityItem = activityItems.items[activityItemKey]
            if (
                activityItem.type !== 'list-item' ||
                activityItem.reason !== 'pages-added-to-list'
            ) {
                continue
            }

            await Promise.all(
                activityItem.entries.order.map(async (entryKey) => {
                    await executeUITask<HomeFeedState>(
                        this,
                        (taskState) => ({
                            activityItems: {
                                items: {
                                    [activityItemKey]: {
                                        entries: {
                                            items: {
                                                [entryKey]: {
                                                    annotationEntriesLoadState: {
                                                        $set: taskState,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        }),
                        async () => {
                            const listEntry =
                                activityItem.entries.items[entryKey]

                            const hasAnnotations = await this.dependencies.storage.contentSharing.doesAnnotationExistForPageInList(
                                {
                                    listReference: activityItem.listReference,
                                    normalizedPageUrl: listEntry.normalizedUrl,
                                },
                            )

                            // They're set false by default, so only emit mutation if otherwise
                            if (!hasAnnotations) {
                                return
                            }

                            this.emitMutation({
                                activityItems: {
                                    items: {
                                        [activityItemKey]: {
                                            entries: {
                                                items: {
                                                    [entryKey]: {
                                                        hasAnnotations: {
                                                            $set: hasAnnotations,
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            })
                        },
                    )
                }),
            )
        }
    }

    async checkRepliesExistForAnnotationActivities(
        newActivities: ActivityItem[],
    ) {
        const annotationReferences: SharedAnnotationReference[] = []
        const annotationInfoById: {
            [id: string]: Array<{
                groupId: string
                listReference: SharedListReference | null
            }>
        } = {}
        for (const activity of newActivities) {
            if (
                activity.type !== 'page-item' ||
                activity.reason !== 'new-annotations'
            ) {
                continue
            }

            for (const annotationItem of Object.values(
                activity.annotations.items,
            )) {
                const annotationReference = annotationItem.reference
                annotationReferences.push(annotationReference)

                annotationInfoById[annotationReference.id] =
                    annotationInfoById[annotationReference.id] ?? []
                annotationInfoById[annotationReference.id].push({
                    groupId: activity.groupId,
                    listReference: activity.listReference,
                })
            }
        }

        const threads = await this.dependencies.storage.contentConversations.getThreadsForAnnotations(
            {
                annotationReferences,
                sharedListReference: null, // TODO: verify this doesn't need to be supplied
            },
        )
        const conversationsMutations: UIMutation<
            HomeFeedState['conversations']
        > = {}
        for (const thread of threads) {
            for (const annotationInfo of annotationInfoById[
                thread.sharedAnnotation.id
            ] || []) {
                if (
                    annotationInfo.listReference &&
                    thread.sharedList &&
                    annotationInfo.listReference.id !== thread.sharedList.id
                ) {
                    continue
                }

                const conversationKey = getConversationKey({
                    groupId: annotationInfo.groupId,
                    annotationReference: thread.sharedAnnotation,
                })
                conversationsMutations[conversationKey] = {
                    thread: { $set: thread.thread },
                }
            }
        }
        this.emitMutation({ conversations: conversationsMutations })
    }

    async loadNextActivities(
        previousState: HomeFeedState,
        options?: { isInitial?: boolean },
    ) {
        const userReference = this.dependencies.services.auth.getCurrentUserReference()
        if (!userReference) {
            return
        }

        const loader = async (f: () => Promise<void>) => {
            if (options?.isInitial) {
                await loadInitial<HomeFeedState>(this, async () => {
                    await f()
                })
            } else {
                await f()
            }
        }

        let activityData: ActivityData | undefined
        const mainMutation: UIMutation<HomeFeedState> = {}
        let organized: ReturnType<typeof organizeActivities>

        await loader(async () => {
            const {
                activityGroups,
                hasMore,
            } = await this.dependencies.services.activityStreams.getHomeFeedActivities(
                { offset: this.itemOffset, limit: this.pageSize },
            )
            this.itemOffset += this.pageSize
            if (!activityGroups.length) {
                this.hasMore = false
                return
            }
            this.hasMore = hasMore

            organized = organizeActivities(activityGroups)
            activityData = organized.data

            const conversations = getInitialAnnotationConversationStates(
                Object.keys(activityData.replies)
                    .map((conversationKey) => {
                        return {
                            linkId: conversationKey,
                        }
                    })
                    .filter((linkId) => !!linkId),
                null, // TODO: verify we don't need to doubly index state by list
            )
            for (const conversationKey of Object.keys(organized.data.replies)) {
                const replies = organized.data?.replies[conversationKey]
                const annotationReplies =
                    activityData.annotationItems[conversationKey].replies
                const loadState =
                    organized.conversationLoadStates[conversationKey] ??
                    'success'
                conversations[conversationKey] = {
                    ...conversations[conversationKey],
                    loadState,
                    hasThreadLoadLoadState:
                        loadState === 'success' ? 'success' : 'pristine',
                    expanded: annotationReplies.length > 0,
                    replies: annotationReplies
                        .map((replyItem) => {
                            return replies?.[replyItem.reference.id]!
                        })
                        .filter((reply) => !!reply),
                }
            }

            const nextActivityItems = arrayToOrderedMap(
                organized.activityItems,
                (item) => {
                    if (item.type === 'list-item') {
                        return item.listReference.id
                    }
                    return item.groupId
                },
            )

            mainMutation.activityItems = {
                order: { $push: nextActivityItems.order },
                items: { $merge: nextActivityItems.items },
            }
            mainMutation.conversations = { $merge: conversations }
            mainMutation.annotations = { $merge: organized.data.annotations }
            mainMutation.pageInfo = { $merge: organized.data.pageInfo }
            mainMutation.replies = { $merge: organized.data.replies }
            mainMutation.users = { $merge: organized.data.users }
            this.emitMutation(mainMutation)
        })

        const nextState = this.withMutation(previousState, mainMutation)

        await Promise.all([
            // this.users.loadUsers(Object.values(activityData?.annotations ?? {}).map(
            //     ({ creatorReference }) => creatorReference,
            // )).then(() => { }),
            // this.users.loadUsers(allReplies.map(({ creatorReference }) => creatorReference)).then(() => { }),
            ...(options?.isInitial
                ? [
                      this.dependencies.storage.activityStreams
                          .updateHomeFeedTimestamp({
                              user: userReference,
                              timestamp: Date.now(),
                          })
                          .then(({ previousTimestamp }) => {
                              this.emitMutation({
                                  lastSeenTimestamp: {
                                      $set: previousTimestamp,
                                  },
                              })
                          }),
                  ]
                : []),
            this.checkAnnotationsExistForActivityItems(nextState),
            organized! &&
                this.checkRepliesExistForAnnotationActivities(
                    organized!.activityItems,
                ),
        ])
    }
}

export function organizeActivities(
    activities: Array<ActivityStreamResultGroup<keyof ActivityStream>>,
): {
    activityItems: Array<ActivityItem>
    data: ActivityData
    conversationLoadStates: { [conversationKey: string]: UITaskState }
} {
    const data: ActivityData = {
        pageInfo: {},
        annotations: {},
        replies: {},
        annotationItems: {},
        users: {},
    }
    const conversationLoadStates: {
        [conversationKey: string]: UITaskState
    } = {}

    const activityItems: ActivityItem[] = []
    for (const activityGroup of activities) {
        if (
            activityGroup.entityType === 'conversationThread' &&
            activityGroup.activityType === 'conversationReply'
        ) {
            const replyActivityGroup = activityGroup as ActivityStreamResultGroup<
                'conversationThread',
                'conversationReply'
            >
            replyActivityGroup.activities = sortBy(
                replyActivityGroup.activities,
                ({ activity }) => activity.reply.createdWhen,
            )

            const firstReplyActivity = replyActivityGroup.activities[0].activity
            const groupAnnotation = firstReplyActivity.annotation
            const annotationItem: AnnotationActivityItem = {
                type: 'annotation-item',
                reference: groupAnnotation.reference,
                hasEarlierReplies: false, // This gets determined after all replies processed
                replies: [],
            }
            const listReference =
                firstReplyActivity.sharedList?.reference ?? null

            data.annotationItems[
                getConversationKey({
                    groupId: activityGroup.id,
                    annotationReference: groupAnnotation.reference,
                })
            ] = annotationItem
            data.users[firstReplyActivity.annotationCreator.reference.id] =
                firstReplyActivity.annotationCreator

            const pageItem: PageActivityItem = {
                type: 'page-item',
                groupId: activityGroup.id,
                reason: 'new-replies',
                listReference: firstReplyActivity.sharedList?.reference ?? null,
                normalizedPageUrl: firstReplyActivity.normalizedPageUrl,
                notifiedWhen: 0,
                // TODO: When the correct page creator is stored in the feed, set it here
                creatorReference:
                    firstReplyActivity.annotationCreator.reference,
                annotations: arrayToOrderedMap(
                    [annotationItem],
                    (item) => item.reference.id,
                ),
            }
            activityItems.push(pageItem)
            // TODO: When the correct page creator is stored in the feed, load it here

            const annotationReference = groupAnnotation.reference
            const conversationKey = getConversationKey({
                groupId: activityGroup.id,
                annotationReference,
            })
            for (const activityInGroup of replyActivityGroup.activities) {
                const replyActivity = activityInGroup.activity
                data.pageInfo[replyActivity.normalizedPageUrl] =
                    replyActivity.pageInfo
                data.annotations[annotationReference.id] = {
                    linkId: annotationReference.id as string,
                    creatorReference: replyActivity.annotationCreator.reference,
                    ...replyActivity.annotation,
                }

                if (!data.replies[conversationKey]) {
                    data.replies[conversationKey] = {}
                }
                data.replies[conversationKey][
                    replyActivity.reply.reference.id
                ] = {
                    reference: replyActivity.reply.reference,
                    previousReplyReference:
                        replyActivity.reply.previousReplyReference,
                    creatorReference: replyActivity.replyCreator.reference,
                    reply: {
                        ...replyActivity.reply,
                        normalizedPageUrl: replyActivity.normalizedPageUrl,
                    },
                }

                annotationItem.replies.push({
                    reference: replyActivity.reply.reference,
                })
                data.users[replyActivity.replyCreator.reference.id] =
                    replyActivity.replyCreator
                pageItem.notifiedWhen = replyActivity.reply.createdWhen
            }
            annotationItem.hasEarlierReplies =
                data.replies[conversationKey][
                    annotationItem.replies[0].reference.id
                ].previousReplyReference !== null
        } else if (
            activityGroup.entityType === 'sharedList' &&
            activityGroup.activityType === 'sharedListEntry'
        ) {
            const entryActivityGroup = activityGroup as ActivityStreamResultGroup<
                'sharedList',
                'sharedListEntry'
            >
            entryActivityGroup.activities = orderBy(
                entryActivityGroup.activities,
                [({ activity }) => activity.entry.createdWhen],
                ['desc'],
            )
            const { activity: firstActivity } = entryActivityGroup.activities[0]

            activityItems.push({
                type: 'list-item',
                groupId: entryActivityGroup.id,
                reason: 'pages-added-to-list',
                listName: firstActivity.list.title,
                listReference: firstActivity.list.reference,
                notifiedWhen: firstActivity.entry.createdWhen,
                entries: arrayToOrderedMap(
                    entryActivityGroup.activities.map(
                        ({ activity }): ListEntryActivityItem => ({
                            type: 'list-entry-item',
                            areAnnotationsShown: false,
                            annotationEntriesLoadState: 'pristine',
                            annotations: createOrderedMap(),
                            annotationsLoadState: 'pristine',
                            reference: activity.entry.reference,
                            entryTitle: activity.entry.entryTitle,
                            originalUrl: activity.entry.originalUrl,
                            creator: activity.entryCreator.reference,
                            normalizedUrl: activity.entry.normalizedUrl,
                            activityTimestamp:
                                activity.entry.updatedWhen ??
                                activity.entry.createdWhen,
                        }),
                    ),
                    (item) => item.reference.id,
                ),
            })
            for (const entryActivity of entryActivityGroup.activities) {
                data.users[entryActivity.activity.entryCreator.reference.id] =
                    entryActivity.activity.entryCreator
            }
        } else if (
            (activityGroup.entityType === 'sharedList' ||
                activityGroup.entityType === 'sharedPageInfo') &&
            activityGroup.activityType === 'annotationListEntry'
        ) {
            const entryActivityGroup = activityGroup as ActivityStreamResultGroup<
                'sharedListEntry',
                'annotationListEntry'
            >
            entryActivityGroup.activities = orderBy(
                entryActivityGroup.activities,
                [({ activity }) => activity.annotation.createdWhen],
                ['desc'],
            )
            const { activity: firstActivity } = entryActivityGroup.activities[0]

            const annotationItems: AnnotationActivityItem[] = []
            for (const activityInGroup of entryActivityGroup.activities) {
                const entryActivity = activityInGroup.activity
                data.pageInfo[entryActivity.annotation.normalizedPageUrl] =
                    entryActivity.pageInfo
                data.annotations[entryActivity.annotation.reference.id] = {
                    linkId: entryActivity.annotation.reference.id as string,
                    creatorReference: entryActivity.annotationCreator.reference,
                    ...entryActivity.annotation,
                }
                data.users[entryActivity.annotationCreator.reference.id] =
                    entryActivity.annotationCreator
                data.users[entryActivity.listCreator.reference.id] =
                    entryActivity.listCreator
                data.users[entryActivity.listEntryCreator.reference.id] =
                    entryActivity.listCreator

                const conversationKey = getConversationKey({
                    groupId: activityGroup.id,
                    annotationReference: entryActivity.annotation.reference,
                })
                conversationLoadStates[conversationKey] = 'pristine'
                if (!data.replies[conversationKey]) {
                    data.replies[conversationKey] = {}
                }
                const annotationItem: AnnotationActivityItem = {
                    type: 'annotation-item',
                    hasEarlierReplies: false,
                    reference: entryActivity.annotation.reference,
                    replies: [],
                }
                annotationItems.push(annotationItem)
                data.annotationItems[
                    getConversationKey({
                        groupId: activityGroup.id,
                        annotationReference: entryActivity.annotation.reference,
                    })
                ] = annotationItem
            }

            activityItems.push({
                type: 'page-item',
                reason: 'new-annotations',
                creatorReference: firstActivity.listEntryCreator.reference,
                notifiedWhen: firstActivity.annotation.createdWhen,
                groupId: entryActivityGroup.id,
                normalizedPageUrl: firstActivity.pageInfo.normalizedUrl,
                listReference: firstActivity.list.reference,
                list: {
                    reference: firstActivity.list.reference,
                    title: firstActivity.list.title,
                },
                annotations: arrayToOrderedMap(
                    annotationItems,
                    (item) => item.reference.id,
                ),
            })
        } else {
            console.warn(
                `Ignored unknown activity ${activityGroup.entityType}:${activityGroup.activityType}`,
            )
        }
    }

    return {
        activityItems,
        data,
        conversationLoadStates,
    }
}

function findActivityItem(
    activityItems: OrderedMap<ActivityItem>,
    groupId: string,
) {
    return Object.values(activityItems.items).find(
        (item) => item.groupId === groupId,
    )
}

export function getConversationKey(input: {
    groupId: string
    annotationReference: SharedAnnotationReference
}) {
    return `${input.groupId}:${input.annotationReference.id}`
}

export function splitConversationKey(
    key: string,
): {
    groupId: string
    annotationReference: SharedAnnotationReference
} {
    const keyParts = key.split(':')
    const groupId = keyParts.slice(0, -1).join(':')
    const annotationId = keyParts.slice(-1)[0]
    return {
        groupId,
        annotationReference: {
            type: 'shared-annotation-reference',
            id: annotationId,
        },
    }
}
