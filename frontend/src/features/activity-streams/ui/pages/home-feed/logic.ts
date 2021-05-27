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
    setupAuthDeps,
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
} from '../../../../../utils/ordered-map'
import {
    User,
    UserReference,
} from '@worldbrain/memex-common/lib/web-interface/types/users'
import { SharedAnnotationReference } from '@worldbrain/memex-common/lib/content-sharing/types'

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
                ...this.dependencies,
                ...setupAuthDeps(this.dependencies),
                getAnnotation: (state, reference) => {
                    const annotation = state.annotations[reference.id]
                    if (!annotation) {
                        return null
                    }
                    return {
                        annotation,
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
    }

    getInitialState(): HomeFeedState {
        return {
            loadState: 'pristine',
            activityItems: createOrderedMap(),
            pageInfo: {},
            annotations: {},
            replies: {},
            users: {},
            moreRepliesLoadStates: {},
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
                        loadState: 'pristine',
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
        const { groupId, annotationReference } = incoming.event
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
                        annotationReference: incoming.event.annotationReference,
                    },
                )
                console.log('rep:', rep)
                console.log('event:', incoming.event, conversationKey)
                console.log('state:', incoming.previousState)
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

            for (const entryKey of activityItem.entries.order) {
                const listEntry = activityItem.entries.items[entryKey]

                const hasAnnotations = await this.dependencies.storage.contentSharing.doesAnnotationExistForPageInList(
                    {
                        listReference: activityItem.listReference,
                        normalizedPageUrl: listEntry.normalizedUrl,
                    },
                )

                // They're set false by default, so only emit mutation if otherwise
                if (!hasAnnotations) {
                    continue
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
            }
        }
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

            const organized = organizeActivities(activityGroups)
            activityData = organized.data

            const conversations = getInitialAnnotationConversationStates(
                Object.keys(activityData.replies)
                    .map((conversationKey) => {
                        return {
                            linkId: conversationKey,
                        }
                    })
                    .filter((linkId) => !!linkId),
            )
            for (const conversationKey of Object.keys(organized.data.replies)) {
                const annotationReplies =
                    activityData.annotationItems[conversationKey].replies
                conversations[conversationKey] = {
                    ...conversations[conversationKey],
                    loadState: 'success',
                    expanded: true,
                    replies: annotationReplies
                        .map((replyItem) => {
                            return organized.data?.replies[conversationKey]?.[
                                replyItem.reference.id
                            ]!
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
        ])
    }
}

export function organizeActivities(
    activities: Array<ActivityStreamResultGroup<keyof ActivityStream>>,
): {
    activityItems: Array<ActivityItem>
    data: ActivityData
} {
    const data: ActivityData = {
        pageInfo: {},
        annotations: {},
        replies: {},
        annotationItems: {},
        users: {},
    }

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
        } else {
            console.warn(
                `Ignored unknown activity ${activityGroup.entityType}:${activityGroup.activityType}`,
            )
        }
    }

    return {
        activityItems,
        data,
    }
}

export function getConversationKey(input: {
    groupId: string
    annotationReference: SharedAnnotationReference
}) {
    return `${input.groupId}:${input.annotationReference.id}`
}
