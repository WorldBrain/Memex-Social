import {
    ActivityStreamResult,
    ActivityStreamResultGroup,
} from '@worldbrain/memex-common/lib/activity-streams/types'
// import { organizeNotifications } from "./logic"

describe('Home feed logic tests', () => {
    function createReplyActivityFactory() {
        const objects: {
            pages: {
                [normalizedPageUrl: string]: {
                    createdWhen: number
                    index: number
                }
            }
            annotations: {
                [normalizedPageUrl: string]: {
                    createdWhen: number
                    index: number
                }
            }
            threads: {
                [normalizedPageUrl: string]: {
                    createdWhen: number
                    index: number
                }
            }
            users: {
                [normalizedPageUrl: string]: {
                    createdWhen: number
                    index: number
                }
            }
        } = { pages: {}, annotations: {}, threads: {}, users: {} }
        let time = 0
        let notificationCount = 0

        const createOrGet = (type: keyof typeof objects, key: string) => {
            if (!objects[type][key]) {
                time += 1
                objects[type][key] = {
                    createdWhen: time,
                    index: Object.values(objects[type]).length,
                }
            }
            return objects[type][key]
        }

        return (params: {
            normalizedPageUrl: string
            contentCreator: string
            annotationId: string
            replies: Array<{
                replyCreator: string
            }>
        }): ActivityStreamResultGroup<
            'conversationThread',
            'conversationReply'
        > => {
            const contentCreator = createOrGet('users', params.contentCreator)
            const page = createOrGet('pages', params.normalizedPageUrl)
            const annotation = createOrGet('annotations', params.annotationId)
            const thread = createOrGet('threads', params.normalizedPageUrl)
            return {
                id: '',
                entityType: 'conversationThread',
                entity: {
                    type: 'conversation-thread-reference',
                    id: `thread-${thread.index}`,
                },
                activityType: 'conversationReply',
                activities: params.replies.map(
                    (
                        replyData,
                    ): ActivityStreamResult<
                        'conversationThread',
                        'conversationReply'
                    > => {
                        const replyCreator = createOrGet(
                            'users',
                            replyData.replyCreator,
                        )
                        const reply = createOrGet(
                            'users',
                            replyData.replyCreator,
                        )
                        return {
                            id: ++notificationCount,
                            activity: {
                                normalizedPageUrl: params.normalizedPageUrl,
                                annotationCreator: {
                                    reference: {
                                        type: 'user-reference',
                                        id: `user-${contentCreator.index}`,
                                    },
                                    displayName: params.contentCreator,
                                },
                                annotation: {
                                    reference: {
                                        type: 'shared-annotation-reference',
                                        id: `annot-${annotation.index}`,
                                    },
                                    createdWhen: annotation.createdWhen,
                                    updatedWhen: annotation.createdWhen,
                                    uploadedWhen: annotation.createdWhen,
                                    normalizedPageUrl: params.normalizedPageUrl,
                                    body: `body ${annotation.index}`,
                                    comment: `comment ${annotation.index}`,
                                },
                                replyCreator: {
                                    reference: {
                                        type: 'user-reference',
                                        id: `user-${replyCreator.index}`,
                                    },
                                    displayName: replyData.replyCreator,
                                },
                                reply: {
                                    reference: {
                                        type: 'conversation-reply-reference',
                                        id: `reply-${reply.index}`,
                                    },
                                    normalizedPageUrl: params.normalizedPageUrl,
                                    createdWhen: reply.createdWhen,
                                    content: `reply ${reply.index}`,
                                    previousReplyReference: null,
                                },
                                pageInfo: {
                                    reference: {
                                        type: 'shared-page-info-reference',
                                        id: `page-${page.index}`,
                                    },
                                    createdWhen: page.createdWhen,
                                    updatedWhen: page.createdWhen,
                                    normalizedUrl: params.normalizedPageUrl,
                                    originalUrl: `https://www.${params.normalizedPageUrl}`,
                                    fullTitle: `${params.normalizedPageUrl} title`,
                                },
                            },
                        }
                    },
                ),
            }
        }
    }

    describe('organizeActivities()', () => {
        it('should split activities in the same group', () => {
            // const activityFactory = createReplyActivityFactory()
            // const activities = [
            //     activityFactory({
            //         contentCreator: 'Bob',
            //         normalizedPageUrl: 'test-one.com',
            //         annotationId: 'test.com:1',
            //         replies: [
            //             { replyCreator: 'Joe' }
            //         ]
            //     }),
            //     activityFactory({
            //         contentCreator: 'Bob',
            //         normalizedPageUrl: 'test-one.com',
            //         annotationId: 'test.com:1',
            //         replies: [{ replyCreator: 'Joe' }]
            //     }),
            // ]
            // console.log(inspect(activities, false, null, true))
            //             expect(organizeNotifications(notifications as any[])).toEqual({
            //             })
        })
    })
})
