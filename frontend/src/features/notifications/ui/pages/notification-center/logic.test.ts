import expect from "expect"
import { organizeNotifications } from "./logic"
import { AnnotationReplyActivity, NotificationStreamResult } from "@worldbrain/memex-common/lib/activity-streams/types"

describe('Notification logic tests', () => {
    function createReplyNotificationFactory() {
        const objects: {
            pages: { [normalizedPageUrl: string]: { createdWhen: number, index: number } },
            annotations: { [normalizedPageUrl: string]: { createdWhen: number, index: number } },
            users: { [normalizedPageUrl: string]: { createdWhen: number, index: number } },
        } = { pages: {}, annotations: {}, users: {} }
        let time = 0
        let notificationCount = 0

        const createOrGet = (type: keyof typeof objects, key: string) => {
            if (!objects[type][key]) {
                time += 1
                objects[type][key] = { createdWhen: time, index: Object.values(objects[type]).length }
            }
            return objects[type][key]
        }

        return (params: {
            contentCreator: string,
            normalizedPageUrl: string,
            annotationId: string,
            replyCreator: string
        }): NotificationStreamResult<'sharedAnnotation', 'conversationReply'> => {
            const contentCreator = createOrGet('users', params.contentCreator)
            const page = createOrGet('pages', params.normalizedPageUrl)
            const annotation = createOrGet('annotations', params.annotationId)
            const replyCreator = createOrGet('users', params.replyCreator)
            const reply = createOrGet('users', params.replyCreator)

            return {
                id: ++notificationCount,
                entityType: 'sharedAnnotation',
                entity: { type: 'shared-annotation-reference', id: `annot-${annotation.index}` },
                activityType: 'conversationReply',
                seen: false,
                read: false,
                activity: {
                    normalizedPageUrl: params.normalizedPageUrl,
                    annotationCreator: {
                        reference: { type: 'user-reference', id: `user-${contentCreator.index}` },
                        displayName: params.contentCreator,
                    },
                    annotation: {
                        reference: { type: 'shared-annotation-reference', id: `annot-${annotation.index}` },
                        createdWhen: annotation.createdWhen,
                        updatedWhen: annotation.createdWhen,
                        uploadedWhen: annotation.createdWhen,
                        normalizedPageUrl: params.normalizedPageUrl,
                        body: `body ${annotation.index}`,
                        comment: `comment ${annotation.index}`
                    },
                    replyCreator: {
                        reference: { type: 'user-reference', id: `user-${replyCreator.index}` },
                        displayName: params.replyCreator,
                    },
                    reply: {
                        reference: { type: 'conversation-reply-reference', id: `reply-${reply.index}` },
                        normalizedPageUrl: params.normalizedPageUrl,
                        createdWhen: reply.createdWhen,
                        content: `reply ${reply.index}`,
                    },
                    pageInfo: {
                        reference: { type: 'shared-page-info-reference', id: `page-${page.index}` },
                        createdWhen: page.createdWhen,
                        updatedWhen: page.createdWhen,
                        normalizedUrl: params.normalizedPageUrl,
                        originalUrl: `https://www.${params.normalizedPageUrl}`,
                        fullTitle: `${params.normalizedPageUrl} title`,
                    },
                }
            }
        }
    }

    describe('organizeNotifications()', () => {
        it('TODO: should group two replies on a single annotation', () => {
            const notificationFactory = createReplyNotificationFactory()
            const notifications = [
                notificationFactory({
                    contentCreator: 'Bob',
                    normalizedPageUrl: 'test-one.com',
                    annotationId: 'test.com:1',
                    replyCreator: 'Joe'
                }),
                notificationFactory({
                    contentCreator: 'Bob',
                    normalizedPageUrl: 'test-one.com',
                    annotationId: 'test.com:1',
                    replyCreator: 'Joe'
                }),
            ]
            console.log(notifications)

            expect(organizeNotifications(notifications as any[])).toEqual({

            })
        })
    })
})