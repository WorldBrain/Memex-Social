import flatten from "lodash/flatten"
import orderBy from "lodash/orderBy"
import { AnnotationReplyActivity, NotificationStream, AnnotationActivityStream } from "@worldbrain/memex-common/lib/activity-streams/types"
import { UILogic, UIEventHandler, loadInitial, executeUITask } from "../../../../../main-ui/classes/logic"
import { NotificationCenterEvent, NotificationCenterDependencies, NotificationCenterState, PageNotificationItem, AnnotationNotificationItem, NotificationItem, NotificationData } from "./types"
import { getInitialAnnotationConversationStates } from "../../../../content-conversations/ui/utils"
import { annotationConversationInitialState, annotationConversationEventHandlers } from "../../../../content-conversations/ui/logic"
import UserProfileCache from "../../../../user-management/utils/user-profile-cache"
import { SharedAnnotationReference } from "@worldbrain/memex-common/lib/content-sharing/types"

type EventHandler<EventName extends keyof NotificationCenterEvent> = UIEventHandler<NotificationCenterState, NotificationCenterEvent, EventName>

export default class NotificationCenterLogic extends UILogic<NotificationCenterState, NotificationCenterEvent> {
    _users: UserProfileCache

    constructor(private dependencies: NotificationCenterDependencies) {
        super()

        this._users = new UserProfileCache(dependencies)

        Object.assign(this, annotationConversationEventHandlers<NotificationCenterState>(this as any, {
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

    getInitialState(): NotificationCenterState {
        return {
            loadState: 'pristine',
            notificationItems: [],
            pageInfo: {},
            annotations: {},
            replies: {},
            users: {},
            ...annotationConversationInitialState(),
        }
    }

    init: EventHandler<'init'> = async () => {
        let notificationData: NotificationData | undefined
        await loadInitial<NotificationCenterState>(this, async () => {
            const notifications = await this.dependencies.services.activityStreams.getNotifications({ markAsSeen: true })
            const organized = organizeNotifications(notifications)
            notificationData = organized.data

            const conversations = getInitialAnnotationConversationStates(Object.values(organized.data.annotations))
            for (const [annotationId, annotationReplies] of Object.entries(organized.data.replies)) {
                conversations[annotationId] = {
                    ...conversations[annotationId],
                    loadState: 'success',
                    expanded: true,
                    replies: orderBy(annotationReplies, 'createdWhen', 'desc')
                }
            }

            return {
                mutation: {
                    notificationItems: { $set: organized.notificationItems },
                    pageInfo: { $set: organized.data.pageInfo },
                    annotations: { $set: organized.data.annotations },
                    replies: { $set: organized.data.replies },
                    conversations: { $set: conversations }
                }
            }
        })

        const allReplies = flatten(Object.values(notificationData?.replies ?? {}).map(
            annotationReplies => Object.values(annotationReplies))
        )
        await Promise.all([
            ...Object.values(notificationData?.annotations ?? {}).map(async ({ creatorReference }) => {
                this.emitMutation({
                    users: { [creatorReference.id]: { $set: await this._users.loadUser(creatorReference) } }
                })
            }),
            ...allReplies.map(async ({ creatorReference }) => {
                this.emitMutation({
                    users: { [creatorReference.id]: { $set: await this._users.loadUser(creatorReference) } }
                })
            })
        ])
    }

    markAsRead: EventHandler<'markAsRead'> = async ({ event, previousState }) => {
        await executeUITask<NotificationCenterState>(this, (taskState) => ({
            replies: { [event.annotationReference.id]: { [event.replyReference.id]: { markAsReadState: { $set: taskState } } } }
        }), async () => {
            await this.dependencies.services.activityStreams.markNotifications({
                ids: [previousState.replies[event.annotationReference.id][event.replyReference.id].notificationId],
                read: true,
            })
            this.emitMutation({
                replies: { [event.annotationReference.id]: { [event.replyReference.id]: { read: { $set: true } } } }
            })
        })
    }
}

export function organizeNotifications(notifications: NotificationStream): {
    notificationItems: Array<NotificationItem>
    data: NotificationData
} {
    const data: NotificationData = {
        pageInfo: {},
        annotations: {},
        replies: {},
    }

    const pageItems: { [normalizedPageUrl: string]: PageNotificationItem } = {}
    const annotationItems: { [annotationId: string]: AnnotationNotificationItem } = {}

    const ensureItem = <T>(items: { [key: string]: T }, key: string, createNew: () => T) => {
        const existing = items[key]
        if (existing) {
            return existing
        }
        const newItem = items[key] = createNew()
        return newItem
    }

    for (const notification of notifications) {
        if (notification.entityType === 'sharedAnnotation' && notification.activityType === 'conversationReply') {
            const annotationReference = notification.entity as SharedAnnotationReference
            const activity: AnnotationReplyActivity['result'] = notification.activity

            data.pageInfo[activity.normalizedPageUrl] = activity.pageInfo
            data.annotations[annotationReference.id] = {
                linkId: annotationReference.id as string,
                creatorReference: activity.annotationCreator.reference,
                ...activity.annotation
            }

            if (!data.replies[annotationReference.id]) {
                data.replies[annotationReference.id] = {}
            }
            data.replies[annotationReference.id][activity.reply.reference.id] = {
                notificationId: notification.id,
                reference: activity.reply.reference,
                creatorReference: activity.replyCreator.reference,
                reply: {
                    ...activity.reply,
                    normalizedPageUrl: activity.normalizedPageUrl,
                },
                seen: notification.seen,
                read: notification.read,
                markAsReadState: 'pristine',
            }

            const pageItem = ensureItem<PageNotificationItem>(pageItems, activity.normalizedPageUrl, () => ({
                type: 'page-item',
                normalizedPageUrl: activity.normalizedPageUrl,
                annotations: []
            }))
            const annotationIsNew = !annotationItems[annotationReference.id]
            const annotationItem = ensureItem<AnnotationNotificationItem>(annotationItems, annotationReference.id as string, () => ({
                type: 'annotation-item',
                reference: annotationReference,
                replies: []
            }))

            if (annotationIsNew) {
                pageItem.annotations.push(annotationItem)
            }
            annotationItem.replies.push({
                reference: activity.reply.reference
            })
        }
    }

    for (const annotationItem of Object.values(annotationItems)) {
        annotationItem.replies = orderBy(annotationItem.replies, (replyItem => data.replies[replyItem.reference.id]?.createdWhen), 'desc')
    }
    for (const pageItem of Object.values(pageItems)) {
        pageItem.annotations = orderBy(pageItem.annotations, annotationItem => {
            const firstReply = data.replies[annotationItem.reference.id]?.[annotationItem.replies[0]?.reference?.id]
            return firstReply?.reply?.createdWhen
        }, 'desc')
    }
    const notificationItmes = orderBy(Object.values(pageItems), pageItem => {
        const firstAnnotation = pageItem.annotations[0]
        const firstReply = data.replies[firstAnnotation.reference.id]?.[firstAnnotation.replies[0]?.reference?.id]
        return firstReply?.reply?.createdWhen
    }, 'desc')

    return {
        notificationItems: notificationItmes,
        data,
    }
}
