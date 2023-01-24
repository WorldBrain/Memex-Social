import createResolvable from '@josephg/resolvable'
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
    UIMutation,
} from '../../../../../main-ui/classes/logic'
import {
    HomeFeedEvent,
    HomeFeedDependencies,
    HomeFeedState,
    ActivityItem,
    AnnotationActivityItem,
} from './types'
import {
    listsSidebarInitialState,
    listsSidebarEventHandlers,
} from '../../../../lists-sidebar/ui/logic'
import UserProfileCache from '../../../../user-management/utils/user-profile-cache'
import {
    createOrderedMap,
    arrayToOrderedMap,
} from '../../../../../utils/ordered-map'
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
    lastSeenResolvable = createResolvable<number | null>()
    users: UserProfileCache
    shouldShowNewLine = false

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
            users: {},
            shouldShowNewLine: true,
            loadingIncludingUIFinished: false,
            ...extDetectionInitialState(),
            ...listsSidebarInitialState(),
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
            await new Promise<void>((resolve) => {
                this.dependencies.services.auth.events.once('changed', () => {
                    resolve()
                })
            })
        }
        this.dependencies.storage.activityStreams
            .updateHomeFeedTimestamp({
                user: userReference!,
                timestamp: Date.now(),
            })
            .then(({ previousTimestamp: lastSeenTimestamp }) => {
                this.lastSeenResolvable.resolve(lastSeenTimestamp)
                this.emitMutation({
                    lastSeenTimestamp: {
                        $set: lastSeenTimestamp,
                    },
                })
            })

        await this.loadNextActivities({ isInitial: true })
        await this.processUIEvent('initActivityFollows', {
            previousState,
            event,
        })
    }

    getLastSeenLinePosition: EventHandler<'getLastSeenLinePosition'> = async ({}) => {
        const lastSeenLineID = document.getElementById('lastSeenLine')

        if (lastSeenLineID) {
            const seenLinePosition = Array.from(
                lastSeenLineID?.parentNode?.children ?? [],
            ).indexOf(lastSeenLineID)
            if (seenLinePosition === 1) {
                this.emitMutation({
                    shouldShowNewLine: { $set: false },
                })
            }
        }
    }

    waypointHit: EventHandler<'waypointHit'> = async ({ previousState }) => {
        if (this.hasMore) {
            await this.loadNextActivities()
        }
    }

    async loadNextActivities(options?: { isInitial?: boolean }) {
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

            const lastSeenTimestamp = await this.lastSeenResolvable
            organized = organizeActivities(activityGroups, {
                lastSeenTimestamp,
            })

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

            mainMutation.shouldShowNewLine = {
                $set:
                    this.shouldShowNewLine ||
                    !lastSeenTimestamp ||
                    organized.activityItems[0]?.notifiedWhen >
                        lastSeenTimestamp,
            }
            this.emitMutation(mainMutation)
        })
    }
}

export function organizeActivities(
    activities: Array<ActivityStreamResultGroup<keyof ActivityStream>>,
    options: { lastSeenTimestamp: number | null },
): {
    activityItems: Array<ActivityItem>
} {
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

            const pageItem: AnnotationActivityItem = {
                groupId: activityGroup.id,
                notifiedWhen: 0,
                activityCount: activityGroup.activities.length,
                type: 'annotation-item',
                reason: 'new-replies',
                pageTitle: firstReplyActivity.pageInfo.fullTitle,
                normalizedPageUrl: firstReplyActivity.normalizedPageUrl,
                creatorReference:
                    firstReplyActivity.annotationCreator.reference,
                annotation: firstReplyActivity.annotation,
            }
            activityItems.push(pageItem)
            for (const activityInGroup of replyActivityGroup.activities) {
                const replyActivity = activityInGroup.activity
                pageItem.notifiedWhen = replyActivity.reply.createdWhen
            }
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
                groupId: entryActivityGroup.id,
                notifiedWhen: firstActivity.entry.createdWhen,
                activityCount: activityGroup.activities.length,
                type: 'list-item',
                reason: 'pages-added-to-list',
                listName: firstActivity.list.title,
                listReference: firstActivity.list.reference,
            })
        } else if (
            (activityGroup.entityType === 'sharedList' ||
                activityGroup.entityType === 'sharedListEntry' ||
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

            activityItems.push({
                groupId: entryActivityGroup.id,
                notifiedWhen: firstActivity.annotation.createdWhen,
                activityCount: activityGroup.activities.length,
                type: 'page-item',
                reason: 'new-annotations',
                pageTitle: firstActivity.pageInfo.fullTitle,
                creatorReference: firstActivity.listEntryCreator.reference,
                normalizedPageUrl: firstActivity.pageInfo.normalizedUrl,
                list: {
                    reference: firstActivity.list.reference,
                    title: firstActivity.list.title,
                },
            })
        } else {
            console.warn(
                `Ignored unknown activity ${activityGroup.entityType}:${activityGroup.activityType}`,
            )
        }
    }

    return {
        activityItems,
    }
}
