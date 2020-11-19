import { UILogic, UIEventHandler, loadInitial } from "../../../../../main-ui/classes/logic"
import { NotificationCenterEvent, NotificationCenterDependencies, NotificationCenterState, PageNotificationItem, AnnotationNotificationItem, NotificationItem, NotificationData } from "./types"
import { AnnotationReplyActivity, NotificationStream } from "@worldbrain/memex-common/lib/activity-streams/types"
import orderBy from "lodash/orderBy"
import { getInitialAnnotationConversationStates } from "../../../../content-conversations/ui/utils"
import { annotationConversationInitialState } from "../../../../content-conversations/ui/logic"
import UserProfileCache from "../../../../user-management/utils/user-profile-cache"
import { UserReference } from "@worldbrain/memex-common/lib/web-interface/types/users"
import flatten from "lodash/flatten"

type EventHandler<EventName extends keyof NotificationCenterEvent> = UIEventHandler<NotificationCenterState, NotificationCenterEvent, EventName>

export default class NotificationCenterLogic extends UILogic<NotificationCenterState, NotificationCenterEvent> {
    _users: UserProfileCache

    constructor(private dependencies: NotificationCenterDependencies) {
        super()

        this._users = new UserProfileCache(dependencies)
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
            const notifications = await this.dependencies.services.activityStreams.getNotifications()
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
        if (notification.entityType === 'annotation' && notification.activityType === 'reply') {
            const activity: AnnotationReplyActivity['result'] = notification.activity

            data.pageInfo[activity.normalizedPageUrl] = activity.pageInfo
            data.annotations[activity.annotationReference.id] = {
                linkId: activity.annotationReference.id as string,
                creatorReference: activity.annotationCreator,
                ...activity.annotation
            }

            if (!data.replies[activity.annotationReference.id]) {
                data.replies[activity.annotationReference.id] = {}
            }
            data.replies[activity.annotationReference.id][activity.replyReference.id] = {
                reference: activity.replyReference,
                creatorReference: activity.replyCreator,
                reply: {
                    ...activity.reply,
                    normalizedPageUrl: activity.normalizedPageUrl,
                }
            }

            const pageItem = ensureItem<PageNotificationItem>(pageItems, activity.normalizedPageUrl, () => ({
                type: 'page-item',
                normalizedPageUrl: activity.normalizedPageUrl,
                annotations: []
            }))
            const annotationItem = ensureItem<AnnotationNotificationItem>(annotationItems, activity.annotationReference.id as string, () => ({
                type: 'annotation-item',
                reference: activity.annotationReference,
                replies: []
            }))

            pageItem.annotations.push(annotationItem)
            annotationItem.replies.push({
                reference: activity.replyReference
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
