import flatten from "lodash/flatten"
import { ActivityStreamResultGroup, ActivityStream } from "@worldbrain/memex-common/lib/activity-streams/types"
import { UILogic, UIEventHandler, loadInitial } from "../../../../../main-ui/classes/logic"
import { HomeFeedEvent, HomeFeedDependencies, HomeFeedState, PageActivityItem, AnnotationActivityItem, ActivityItem, ActivityData } from "./types"
import { getInitialAnnotationConversationStates } from "../../../../content-conversations/ui/utils"
import { annotationConversationInitialState, annotationConversationEventHandlers } from "../../../../content-conversations/ui/logic"
import UserProfileCache from "../../../../user-management/utils/user-profile-cache"

type EventHandler<EventName extends keyof HomeFeedEvent> = UIEventHandler<HomeFeedState, HomeFeedEvent, EventName>

export default class HomeFeedLogic extends UILogic<HomeFeedState, HomeFeedEvent> {
    _users: UserProfileCache

    constructor(private dependencies: HomeFeedDependencies) {
        super()

        this._users = new UserProfileCache(dependencies)

        Object.assign(this, annotationConversationEventHandlers<HomeFeedState>(this as any, {
            ...this.dependencies,
            getAnnotation: (state, reference) => {
                const annotation = state.annotations[reference.id]
                if (!annotation) {
                    return null
                }
                return { annotation, pageCreatorReference: annotation.creatorReference }
            },
            loadUser: reference => this._users.loadUser(reference),
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
            ...annotationConversationInitialState(),
        }
    }

    init: EventHandler<'init'> = async () => {
        let userReference = this.dependencies.services.auth.getCurrentUserReference()
        if (!userReference) {
            // Firebase auth doesn't immediately detect authenticated users, so wait if needed
            await new Promise(resolve => {
                this.dependencies.services.auth.events.once('changed', () => {
                    resolve()
                })
            })
            userReference = this.dependencies.services.auth.getCurrentUserReference()
        }
        if (!userReference) {
            return
        }

        let activityData: ActivityData | undefined
        await loadInitial<HomeFeedState>(this, async () => {
            const { activityGroups } = await this.dependencies.services.activityStreams.getHomeFeedActivities({ offset: 0, limit: 50 })
            const organized = organizeActivities(activityGroups)
            activityData = organized.data

            const conversations = getInitialAnnotationConversationStates(Object.values(organized.data.annotations))
            for (const annotationId of Object.keys(organized.data.replies)) {
                conversations[annotationId] = {
                    ...conversations[annotationId],
                    loadState: 'success',
                    expanded: true,
                    // eslint-disable-next-line
                    replies: activityData.annotationItems[annotationId].replies.map(replyItem => (
                        activityData?.replies[annotationId]?.[replyItem.reference.id]!
                    )).filter(reply => !!reply)
                }
            }

            return {
                mutation: {
                    activityItems: { $set: organized.activityItems },
                    pageInfo: { $set: organized.data.pageInfo },
                    annotations: { $set: organized.data.annotations },
                    replies: { $set: organized.data.replies },
                    conversations: { $set: conversations }
                }
            }
        })

        const allReplies = flatten(Object.values(activityData?.replies ?? {}).map(
            annotationReplies => Object.values(annotationReplies))
        )
        await Promise.all([
            ...Object.values(activityData?.annotations ?? {}).map(async ({ creatorReference }) => {
                this.emitMutation({
                    users: { [creatorReference.id]: { $set: await this._users.loadUser(creatorReference) } }
                })
            }),
            ...allReplies.map(async ({ creatorReference }) => {
                this.emitMutation({
                    users: { [creatorReference.id]: { $set: await this._users.loadUser(creatorReference) } }
                })
            }),
            this.dependencies.storage.activityStreams.updateHomeFeedTimestamp({
                user: userReference,
                timestamp: Date.now(),
            }).then(({ previousTimestamp }) => {
                this.emitMutation({ lastSeenTimestamp: { $set: previousTimestamp } })
            })
        ])
    }
}

export function organizeActivities(notifications: Array<ActivityStreamResultGroup<keyof ActivityStream>>): {
    activityItems: Array<ActivityItem>
    data: ActivityData
} {
    const data: ActivityData = {
        pageInfo: {},
        pageItems: {},
        annotations: {},
        annotationItems: {},
        replies: {},
    }

    const activityItems: ActivityItem[] = []
    for (const activityGroup of notifications) {
        if (activityGroup.entityType === 'sharedAnnotation' && activityGroup.activityType === 'conversationReply') {
            const replyActivityGroup = activityGroup as ActivityStreamResultGroup<'sharedAnnotation', 'conversationReply'>

            const annotationItem: AnnotationActivityItem = {
                type: 'annotation-item',
                reference: replyActivityGroup.activities[0].activity.annotation.reference,
                replies: []
            }
            data.annotationItems[annotationItem.reference.id] = annotationItem

            const pageItem: PageActivityItem = {
                type: 'page-item',
                reason: 'new-replies',
                normalizedPageUrl: replyActivityGroup.activities[0].activity.normalizedPageUrl,
                notifiedWhen: 0,
                annotations: [annotationItem],
            }
            data.pageItems[pageItem.normalizedPageUrl] = pageItem
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

                if (!data.replies[annotationReference.id]) {
                    data.replies[annotationReference.id] = {}
                }
                data.replies[annotationReference.id][replyActivity.reply.reference.id] = {
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
    }

    return {
        activityItems,
        data,
    }
}
