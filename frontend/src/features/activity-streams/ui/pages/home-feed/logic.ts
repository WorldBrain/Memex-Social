import flatten from "lodash/flatten"
import sortBy from "lodash/sortBy"
import { ActivityStreamResultGroup, ActivityStream } from "@worldbrain/memex-common/lib/activity-streams/types"
import { UILogic, UIEventHandler, loadInitial, executeUITask, UIMutation } from "../../../../../main-ui/classes/logic"
import { HomeFeedEvent, HomeFeedDependencies, HomeFeedState, PageActivityItem, AnnotationActivityItem, ActivityItem, ActivityData, ListEntryActivityItem, ListActivityItem } from "./types"
import { getInitialAnnotationConversationStates } from "../../../../content-conversations/ui/utils"
import { annotationConversationInitialState, annotationConversationEventHandlers } from "../../../../content-conversations/ui/logic"
import UserProfileCache from "../../../../user-management/utils/user-profile-cache"
import { createOrderedMap, arrayToOrderedMap } from "../../../../../utils/ordered-map"

type EventHandler<EventName extends keyof HomeFeedEvent> = UIEventHandler<HomeFeedState, HomeFeedEvent, EventName>

export default class HomeFeedLogic extends UILogic<HomeFeedState, HomeFeedEvent> {
    pageSize = 50
    itemOffset = 0
    hasMore = true
    users: UserProfileCache

    constructor(private dependencies: HomeFeedDependencies) {
        super()

        this.users = new UserProfileCache(dependencies)

        Object.assign(this, annotationConversationEventHandlers<HomeFeedState>(this as any, {
            ...this.dependencies,
            getAnnotation: (state, reference) => {
                const annotation = state.annotations[reference.id]
                if (!annotation) {
                    return null
                }
                return { annotation, pageCreatorReference: annotation.creatorReference }
            },
            loadUser: reference => this.users.loadUser(reference),
        }))
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
            ...annotationConversationInitialState(),
        }
    }

    init: EventHandler<'init'> = async ({ previousState }) => {
        const userReference = this.dependencies.services.auth.getCurrentUserReference()
        if (!userReference) {
            // Firebase auth doesn't immediately detect authenticated users, so wait if needed
            await new Promise(resolve => {
                this.dependencies.services.auth.events.once('changed', () => {
                    resolve()
                })
            })
        }
        await this.loadNextActivities(previousState, { isInitial: true })
    }

    waypointHit: EventHandler<'waypointHit'> = async ({ previousState }) => {
        if (this.hasMore) {
            await this.loadNextActivities(previousState)
        }
    }

    loadListEntryActivityAnnotations: EventHandler<'loadListEntryActivityAnnotations'> = async ({ event, previousState }) => {
        const { storage, services } = this.dependencies
        const { normalizedPageUrl } = (previousState.activityItems.items[event.listReference.id] as ListActivityItem)
            .entries.items[event.listEntryReference.id]

        const userReference = services.auth.getCurrentUserReference()
        if (!userReference) {
            return
        }

        await executeUITask<HomeFeedState>(this, (taskState) => ({
            activityItems: {
                items: {
                    [event.listReference.id]: {
                        entries: {
                            items: {
                                [event.listEntryReference.id]: {
                                    annotationsLoadState: { $set: taskState },
                                }
                            }
                        }
                    }
                }
            }
        }), async () => {
            const annotations = await storage.contentSharing.getAnnotationsByCreatorAndPageUrl({
                normalizedPageUrl,
                creatorReference: userReference,
            })

            const annotationRefs = annotations.map(a => a.reference)
            const annotationsData: ActivityData['annotations'] = {}

            for (const annotation of annotations) {
                annotationsData[annotation.reference.id] = {
                    ...annotation,
                    creatorReference: annotation.creator,
                    linkId: annotation.reference.id as string,
                }
            }

            this.emitMutation({
                annotations: { $merge: annotationsData },
                activityItems: {
                    items: {
                        [event.listReference.id]: {
                            entries: {
                                items: {
                                    [event.listEntryReference.id]: {
                                        areAnnotationsShown: { $set: true },
                                        annotations: { $set: annotationRefs },
                                    },
                                },
                            }
                        }
                    }
                }
            })
        })
    }

    loadMoreReplies: EventHandler<'loadMoreReplies'> = async (incoming) => {
        const { groupId } = incoming.event

        await executeUITask<HomeFeedState>(this, (taskState) => ({
            moreRepliesLoadStates: { [groupId]: { $set: taskState } }
        }), async () => {
            const replies = (await this.dependencies.storage.contentConversations.getRepliesByAnnotation({
                annotationReference: incoming.event.annotationReference,
            })).filter(replyData => (
                // don't process already loaded replies
                !incoming.previousState.replies[groupId][replyData.reference.id]
            ))
            const conversationsMutations: UIMutation<HomeFeedState['conversations']> = {}
            conversationsMutations[groupId] = {
                replies: {
                    $unshift: await Promise.all(replies.map(async replyData => ({
                        reference: replyData.reference,
                        user: await this.users.loadUser(replyData.userReference),
                        reply: replyData.reply,
                    })))
                }
            }

            const repliesMutation: UIMutation<HomeFeedState['replies']> = {}
            for (const replyData of replies) {
                repliesMutation[groupId] = repliesMutation[groupId] ?? {}
                repliesMutation[groupId] = {
                    ...repliesMutation[groupId],
                    [replyData.reference.id]: {
                        $set: {
                            reference: replyData.reference,
                            creatorReference: replyData.userReference,
                            reply: replyData.reply,
                        }
                    }
                }
            }

            return {
                mutation: {
                    conversations: conversationsMutations,
                    replies: repliesMutation
                }
            }
        })
    }

    private async checkAnnotationsExistForActivityItems({ activityItems }: HomeFeedState) {
        for (const activityItemKey of activityItems.order) {
            const activityItem = activityItems.items[activityItemKey]
            if (activityItem.type !== 'list-item' || activityItem.reason !== 'pages-added-to-list') {
                continue
            }

            for (const entryKey of activityItem.entries.order) {
                const listEntry = activityItem.entries.items[entryKey]

                const hasAnnotations = await this.dependencies.storage.contentSharing.doesAnnotationExistForPageInList({
                    listReference: activityItem.listReference,
                    normalizedPageUrl: listEntry.normalizedPageUrl,
                })

                // They're set false by default, so only emit mutation if otherwise
                if (!hasAnnotations) {
                    continue
                }

                this.emitMutation({
                    activityItems: {
                        items: {
                            [activityItemKey]:  {
                                entries: {
                                    items: {
                                        [entryKey]: {
                                            hasAnnotations: { $set: hasAnnotations },
                                        }
                                    }
                                }
                            }
                        }
                    }
                })
            }
        }
    }

    async loadNextActivities(previousState: HomeFeedState, options?: { isInitial?: boolean }) {
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
            const { activityGroups, hasMore } = await this.dependencies.services.activityStreams.getHomeFeedActivities({ offset: this.itemOffset, limit: this.pageSize })
            this.itemOffset += this.pageSize
            if (!activityGroups.length) {
                this.hasMore = false
                return
            }
            this.hasMore = hasMore

            const organized = organizeActivities(activityGroups)
            activityData = organized.data

            const conversations = getInitialAnnotationConversationStates(organized.activityItems.map((activityItem) => ({
                linkId: activityItem.groupId,
            })))
            for (const groupId of Object.keys(organized.data.replies)) {
                const annotationReplies = activityData.annotationItems[groupId].replies
                conversations[groupId] = {
                    ...conversations[groupId],
                    loadState: 'success',
                    expanded: true,
                    replies: annotationReplies.map(replyItem => {
                        return activityData?.replies[groupId]?.[replyItem.reference.id]!
                    }).filter(reply => !!reply)
                }
            }

            const nextActivityItems = arrayToOrderedMap(organized.activityItems, item => {
                if (item.type === 'list-item') {
                    return item.listReference.id
                }
                return item.normalizedPageUrl
            })

            mainMutation.activityItems = {
                order: { $push: nextActivityItems.order },
                items: { $merge: nextActivityItems.items },
            }
            mainMutation.conversations = { $merge: conversations }
            mainMutation.annotations = { $merge: organized.data.annotations }
            mainMutation.pageInfo = { $merge: organized.data.pageInfo }
            mainMutation.replies = { $merge: organized.data.replies }
            this.emitMutation(mainMutation)
        })

        const nextState = this.withMutation(previousState, mainMutation)

        const allReplies = flatten(Object.values(activityData?.replies ?? {}).map(
            annotationReplies => Object.values(annotationReplies))
        )
        await Promise.all([
            ...Object.values(activityData?.annotations ?? {}).map(async ({ creatorReference }) => {
                this.emitMutation({
                    users: { [creatorReference.id]: { $set: await this.users.loadUser(creatorReference) } }
                })
            }),
            ...allReplies.map(async ({ creatorReference }) => {
                this.emitMutation({
                    users: { [creatorReference.id]: { $set: await this.users.loadUser(creatorReference) } }
                })
            }),
            ...(options?.isInitial ? [this.dependencies.storage.activityStreams.updateHomeFeedTimestamp({
                user: userReference,
                timestamp: Date.now(),
            }).then(({ previousTimestamp }) => {
                this.emitMutation({ lastSeenTimestamp: { $set: previousTimestamp } })
            })] : []),
            this.checkAnnotationsExistForActivityItems(nextState),
        ])
    }
}

export function organizeActivities(activities: Array<ActivityStreamResultGroup<keyof ActivityStream>>): {
    activityItems: Array<ActivityItem>
    data: ActivityData
} {
    const data: ActivityData = {
        pageInfo: {},
        annotations: {},
        replies: {},
        annotationItems: {},
    }

    const activityItems: ActivityItem[] = []
    for (const activityGroup of activities) {
        if (activityGroup.entityType === 'sharedAnnotation' && activityGroup.activityType === 'conversationReply') {
            const replyActivityGroup = activityGroup as ActivityStreamResultGroup<'sharedAnnotation', 'conversationReply'>
            replyActivityGroup.activities = sortBy(replyActivityGroup.activities, ({ activity }) => activity.reply.createdWhen)

            const annotationItem: AnnotationActivityItem = {
                type: 'annotation-item',
                reference: replyActivityGroup.activities[0].activity.annotation.reference,
                hasEarlierReplies: !replyActivityGroup.activities[0].activity.isFirstReply,
                replies: []
            }
            data.annotationItems[activityGroup.id] = annotationItem

            const pageItem: PageActivityItem = {
                type: 'page-item',
                groupId: activityGroup.id,
                reason: 'new-replies',
                normalizedPageUrl: replyActivityGroup.activities[0].activity.normalizedPageUrl,
                notifiedWhen: 0,
                annotations: arrayToOrderedMap([annotationItem], item => item.reference.id),
            }
            // data.pageItems[pageItem.normalizedPageUrl] = pageItem
            activityItems.push(pageItem)

            for (const activityInGroup of replyActivityGroup.activities) {
                const replyActivity = activityInGroup.activity
                const annotationReference = replyActivityGroup.entity
                data.pageInfo[replyActivity.normalizedPageUrl] = replyActivity.pageInfo
                data.annotations[annotationReference.id] = {
                    linkId: annotationReference.id as string,
                    creatorReference: replyActivity.annotationCreator.reference,
                    ...replyActivity.annotation
                }

                if (!data.replies[activityGroup.id]) {
                    data.replies[activityGroup.id] = {}
                }
                data.replies[activityGroup.id][replyActivity.reply.reference.id] = {
                    reference: replyActivity.reply.reference,
                    creatorReference: replyActivity.replyCreator.reference,
                    reply: {
                        ...replyActivity.reply,
                        normalizedPageUrl: replyActivity.normalizedPageUrl,
                    },
                }

                annotationItem.replies.push({
                    reference: replyActivity.reply.reference,
                })
                pageItem.notifiedWhen = replyActivity.reply.createdWhen
            }
        }

        if (activityGroup.entityType === 'sharedList' && activityGroup.activityType === 'sharedListEntry') {
            const entryActivityGroup = activityGroup as ActivityStreamResultGroup<'sharedList', 'sharedListEntry'>
            entryActivityGroup.activities = sortBy(entryActivityGroup.activities, ({ activity }) => activity.entry.createdWhen)
            const { activity: firstActivity } = entryActivityGroup.activities[0]

            activityItems.push({
                type: 'list-item',
                groupId: entryActivityGroup.id,
                reason:'pages-added-to-list',
                listName: firstActivity.list.title,
                listReference: firstActivity.list.reference,
                notifiedWhen: firstActivity.entry.createdWhen,
                entries: arrayToOrderedMap(entryActivityGroup.activities.map(({ activity }): ListEntryActivityItem => ({
                    type: 'list-entry-item',
                    annotations: [],
                    areAnnotationsShown: false,
                    annotationsLoadState: 'pristine',
                    reference: activity.entry.reference,
                    entryTitle: activity.entry.entryTitle,
                    originalUrl: activity.entry.originalUrl,
                    normalizedPageUrl: activity.entry.normalizedUrl,
                    activityTimestamp: activity.entry.updatedWhen ?? activity.entry.createdWhen,
                })), item => item.reference.id)
            })
        }
    }

    return {
        activityItems,
        data,
    }
}
