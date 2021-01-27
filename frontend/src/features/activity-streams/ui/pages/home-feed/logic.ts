import flatten from "lodash/flatten"
import sortBy from "lodash/sortBy"
import { ActivityStreamResultGroup, ActivityStream } from "@worldbrain/memex-common/lib/activity-streams/types"
import { UILogic, UIEventHandler, loadInitial, executeUITask, UIMutation } from "../../../../../main-ui/classes/logic"
import { HomeFeedEvent, HomeFeedDependencies, HomeFeedState, PageActivityItem, AnnotationActivityItem, ActivityItem, ActivityData } from "./types"
import { getInitialAnnotationConversationStates } from "../../../../content-conversations/ui/utils"
import { annotationConversationInitialState, annotationConversationEventHandlers } from "../../../../content-conversations/ui/logic"
import UserProfileCache from "../../../../user-management/utils/user-profile-cache"

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
            activityItems: [],
            pageInfo: {},
            annotations: {},
            replies: {},
            users: {},
            moreRepliesLoadStates: {},
            ...annotationConversationInitialState(),
        }
    }

    init: EventHandler<'init'> = async () => {
        const userReference = this.dependencies.services.auth.getCurrentUserReference()
        if (!userReference) {
            // Firebase auth doesn't immediately detect authenticated users, so wait if needed
            await new Promise(resolve => {
                this.dependencies.services.auth.events.once('changed', () => {
                    resolve()
                })
            })
        }
        await this.loadNextActivities({ isInitial: true })
    }

    waypointHit: EventHandler<'waypointHit'> = async () => {
        if (this.hasMore) {
            await this.loadNextActivities()
        }
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

        let activityData: ActivityData | undefined
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

            // For each added list entry, check if they have associated annotations
            for (const activityItem of organized.activityItems) {
                if (activityItem.type === 'list-item' && activityItem.reason === 'pages-added-to-list') {
                    for (const listEntry of activityItem.entries) {
                        listEntry.hasAnnotations = await this.dependencies.storage.contentSharing.doesAnnotationExistForPageInList({
                            listReference: activityItem.listReference,
                            normalizedPageUrl: listEntry.normalizedPageUrl,
                        })
                    }
                }
            }

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

            this.emitMutation({
                activityItems: { $push: organized.activityItems },
                pageInfo: { $merge: organized.data.pageInfo },
                annotations: { $merge: organized.data.annotations },
                replies: { $merge: organized.data.replies },
                conversations: { $merge: conversations }
            })
        })

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
            })] : [])
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
                annotations: [annotationItem],
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
                entries: entryActivityGroup.activities.map(({ activity }) => ({
                    type: 'list-entry-item',
                    normalizedPageUrl: activity.entry.normalizedUrl,
                }))
            })
        }
    }

    return {
        activityItems,
        data,
    }
}
