import { Storage } from '../storage/types'
import { Services } from '../services/types'
import { ConversationReplyReference } from '@worldbrain/memex-common/lib/content-conversations/types'

type SuccessReplyRes = {
    status: 'success'
    replyReference: ConversationReplyReference
}

type ActivityScript = ActivityScriptStep[]
type ActivityScriptStep =
    | { type: 'login'; user: string; createProfile?: boolean }
    | { type: 'reply'; annotation: string }
    | { type: 'reply'; createdAnnotation: string }
    | { type: 'follow-annotation'; annotation: string }
    | { type: 'follow-list'; list: string }
    | { type: 'list-entries'; list: string; pages: string[] }
    | { type: 'home-feed-timestamp'; user: string; time: '$now' }
    | { type: 'create-page-info'; page: string }
    | {
          type: 'create-annotation'
          page: string
          list: string
          createdId: string
      }

async function setup({
    services,
    storage,
    script,
}: {
    services: Services
    storage: Storage
    script: ActivityScript
}) {
    const replyCountByAnnotation: { [annotationId: string]: number } = {}
    const increasedReplyCount = (annotationId: string | number) => {
        const existingCount = replyCountByAnnotation[annotationId] ?? 0
        const newCount = existingCount + 1
        replyCountByAnnotation[annotationId] = newCount
        return newCount
    }
    const annotationIds: { [localId: string]: string | number } = {}
    const lastReplyByAnnotation: {
        [annotationId: string]: ConversationReplyReference
    } = {}

    let time = Date.now()
    const goBackInTime = (delta: number) => {
        time += delta
        return time
    }

    let homeFeedTimestampUpdated = false

    const annotationCreators: { [annotationId: string]: string } = {}
    const annotationPages: { [annotationId: string]: string } = {}
    const getAnnotationPage = async (annotationId: string | number) => {
        if (annotationPages[annotationId]) {
            return annotationPages[annotationId]
        }
        const annotationData = await storage.serverModules.contentSharing.getAnnotation(
            {
                reference: {
                    type: 'shared-annotation-reference',
                    id: annotationId,
                },
            },
        )
        const {
            annotation: { normalizedPageUrl },
        } = annotationData!
        annotationPages[annotationId] = normalizedPageUrl
        return normalizedPageUrl
    }

    for (const step of script) {
        if (step.type === 'login') {
            if (services.auth.getCurrentUser()) {
                await services.auth.logout()
            }
            await services.auth.loginWithEmailPassword({
                email: step.user,
                password: 'bling',
            })
            if (step.createProfile) {
                await storage.serverModules.users.updateUser(
                    {
                        type: 'user-reference',
                        id: step.user,
                    },
                    {
                        knownStatus: 'exists',
                    },
                    { displayName: `${step.user}'s display name` },
                )
            }
        } else if (step.type === 'reply') {
            const annotId =
                'createdAnnotation' in step
                    ? annotationIds[step.createdAnnotation]
                    : step.annotation
            const normalizedPageUrl = await getAnnotationPage(annotId)
            const replyNumber = increasedReplyCount(annotId)
            const currentUser = await services.auth.getCurrentUserReference()!
            const byMyself =
                currentUser.id ===
                (annotationCreators[annotId] ?? 'default-user')

            const annotationName =
                'createdAnnotation' in step
                    ? `created note: ${step.createdAnnotation}`
                    : annotId
            const extraInfo = [
                homeFeedTimestampUpdated ? 'should be new' : 'should be seen',
                byMyself ? 'to myself should be ignored' : null,
            ]
                .filter((entry) => !!entry)
                .join(', ')

            const replyResult = await services.contentConversations.submitReply(
                {
                    pageCreatorReference: currentUser,
                    annotationReference: {
                        type: 'shared-annotation-reference',
                        id: annotId,
                    },
                    normalizedPageUrl: normalizedPageUrl,
                    reply: {
                        content: `annot in ${normalizedPageUrl} - ${annotationName} - reply ${replyNumber} (${extraInfo})`,
                    },
                    previousReplyReference: lastReplyByAnnotation[annotId],
                },
            )
            if (replyResult.status !== 'success') {
                throw new Error(
                    `Error creating reply ${replyNumber} for page ${normalizedPageUrl}: ${replyResult.status}`,
                )
            }
            // console.log(annotationName, {prev: lastReplyByAnnotation[annotId]?.id, next: replyResult.replyReference.id})

            lastReplyByAnnotation[annotId] = replyResult.replyReference
        } else if (step.type === 'follow-annotation') {
            const annotationReference = {
                type: 'shared-annotation-reference' as 'shared-annotation-reference',
                id: step.annotation,
            }
            const annotationData = await storage.serverModules.contentSharing.getAnnotation(
                {
                    reference: annotationReference,
                },
            )
            if (!annotationData) {
                throw new Error(
                    `Tried to follow non-existing annotation: ${step.annotation}`,
                )
            }
            const thread = await storage.serverModules.contentConversations.getOrCreateThread(
                {
                    pageCreatorReference: annotationData.creatorReference,
                    annotationReference: annotationReference,
                    normalizedPageUrl:
                        annotationData.annotation.normalizedPageUrl,
                    sharedListReference: null,
                },
            )
            await services.activityStreams.followEntity({
                entityType: 'conversationThread',
                entity: thread.reference,
                feeds: { home: true },
            })
        } else if (step.type === 'follow-list') {
            // This will trigger the storage hook submitting the follow to the stream service
            await storage.serverModules.activityFollows.storeFollow({
                userReference: services.auth.getCurrentUserReference()!,
                collection: 'sharedList',
                objectId: step.list,
            })
        } else if (step.type === 'list-entries') {
            await storage.serverModules.contentSharing.createListEntries({
                listReference: { type: 'shared-list-reference', id: step.list },
                listEntries: step.pages.map((page) => ({
                    createdWhen: goBackInTime(1000 * 60 * 60),
                    entryTitle: `${page} title`,
                    normalizedUrl: page,
                    originalUrl: `https://www.${page}`,
                })),
                userReference: services.auth.getCurrentUserReference()!,
            })
        } else if (step.type === 'home-feed-timestamp') {
            await storage.serverModules.activityStreams.updateHomeFeedTimestamp(
                {
                    user: { type: 'user-reference', id: step.user },
                    timestamp: Date.now(),
                },
            )
            homeFeedTimestampUpdated = true
        } else if (step.type === 'create-page-info') {
            await storage.serverModules.contentSharing.createPageInfo({
                creatorReference: services.auth.getCurrentUserReference()!,
                pageInfo: {
                    fullTitle: `${step.page} title`,
                    normalizedUrl: step.page,
                    originalUrl: `https://${step.page}`,
                },
            })
        } else if (step.type === 'create-annotation') {
            const {
                sharedAnnotationReferences,
            } = await storage.serverModules.contentSharing.createAnnotations({
                creator: services.auth.getCurrentUserReference()!,
                listReferences: [
                    { type: 'shared-list-reference', id: step.list },
                ],
                annotationsByPage: {
                    [step.page]: [
                        {
                            createdWhen: Date.now(),
                            comment: `created note: ${step.createdId}`,
                            localId: step.createdId,
                        },
                    ],
                },
            })
            for (const [localId, annotationReference] of Object.entries(
                sharedAnnotationReferences,
            )) {
                annotationIds[localId] = annotationReference.id
            }
        }
    }
}

export const setupTestActivities = async ({
    services,
    storage,
    script,
}: {
    services: Services
    storage: Storage
    script?: ActivityScript
}) => {
    // prettier-ignore
    await setup({
        services,
        storage,
        script: script ?? [
            { type: 'login', user: 'default-user' },
            { type: 'reply', annotation: 'third-annotation' },
            { type: 'reply', annotation: 'third-annotation' },
            { type: 'follow-annotation', annotation: 'default-annotation' },
            { type: 'follow-annotation', annotation: 'second-annotation' },
            { type: 'follow-annotation', annotation: 'third-annotation' },
            { type: 'follow-list', list: 'default-list' },
            { type: 'login', user: 'two@user.com', createProfile: true },
            { type: 'reply', annotation: 'default-annotation' },
            { type: 'reply', annotation: 'default-annotation' },
            { type: 'reply', annotation: 'second-annotation' },
            { type: 'reply', annotation: 'default-annotation' },
            { type: 'list-entries', list: 'default-list', pages: ['new.com/one', 'new.com/two', 'new.com/three'] },
            { type: 'home-feed-timestamp', user: 'default-user', time: '$now' },
            { type: 'reply', annotation: 'third-annotation' },
            { type: 'reply', annotation: 'default-annotation' },
            { type: 'list-entries', list: 'default-list', pages: ['new.com/four', 'new.com/five'] },
            { type: 'create-page-info', page: 'new.com/one' },
            { type: 'create-annotation', page: 'new.com/one', list: 'default-list', createdId: 'first' },
            { type: 'reply', createdAnnotation: 'first' },
            { type: 'reply', createdAnnotation: 'first' },
            { type: 'login', user: 'default-user' },
            { type: 'reply', annotation: 'third-annotation' },
            { type: 'reply', createdAnnotation: 'first' },
        ]
    })

    // await services.auth.loginWithEmailPassword({
    //     email: 'default-user',
    //     password: 'bling'
    // })

    // // This reply is before anyone followed the thread, so it shouldn't show up in any feed
    // const { replyReference: reply1Ref } = await services.contentConversations.submitReply({
    //     pageCreatorReference: { type: 'user-reference', id: 'default-user' },
    //     annotationReference: { type: 'shared-annotation-reference', id: 'third-annotation' },
    //     normalizedPageUrl: 'notion.so',
    //     reply: { content: 'annot in notion.so - third - reply one (to myself, should be hidden)' }
    // }) as SuccessReplyRes

    // // At this point default-user is subscribed to the thread, but shouldn't receive their own reply activity
    // const { replyReference: reply2Ref } = await services.contentConversations.submitReply({
    //     pageCreatorReference: { type: 'user-reference', id: 'default-user' },
    //     annotationReference: { type: 'shared-annotation-reference', id: 'third-annotation' },
    //     normalizedPageUrl: 'notion.so',
    //     reply: { content: 'annot in notion.so - third - reply two (to myself, should be hidden)' },
    //     previousReplyReference: reply1Ref,
    // }) as SuccessReplyRes

    // await services.activityStreams.followEntity({
    //     entityType: 'sharedAnnotation',
    //     entity: { type: 'shared-annotation-reference', id: 'default-annotation' },
    //     feeds: { home: true },
    // })
    // await services.activityStreams.followEntity({
    //     entityType: 'sharedAnnotation',
    //     entity: { type: 'shared-annotation-reference', id: 'second-annotation' },
    //     feeds: { home: true },
    // })
    // await services.activityStreams.followEntity({
    //     entityType: 'sharedAnnotation',
    //     entity: { type: 'shared-annotation-reference', id: 'third-annotation' },
    //     feeds: { home: true },
    // })

    // This will trigger the storage hook submitting the follow to the stream service
    // await storage.serverModules.activityFollows.storeFollow({
    //     userReference: services.auth.getCurrentUserReference()!,
    //     collection: 'sharedList',
    //     objectId: 'default-list'
    // })

    // Switch users
    // await services.auth.logout()
    // await services.auth.loginWithEmailPassword({
    //     email: 'two@user.com',
    //     password: 'bling'
    // })
    // await storage.serverModules.users.updateUser({
    //     type: 'user-reference', id: 'two@user.com'
    // }, {
    //     knownStatus: 'exists'
    // }, { displayName: 'User two' })

    // default-user should receive these activities
    // const { replyReference: reply3Ref } = await services.contentConversations.submitReply({
    //     pageCreatorReference: { type: 'user-reference', id: 'default-user' },
    //     annotationReference: { type: 'shared-annotation-reference', id: 'default-annotation' },
    //     normalizedPageUrl: 'getmemex.com',
    //     reply: { content: 'annot in getmemex.com - default - reply one (should be marked as seen)' }
    // }) as SuccessReplyRes
    // const { replyReference: reply4Ref } = await services.contentConversations.submitReply({
    //     pageCreatorReference: { type: 'user-reference', id: 'default-user' },
    //     annotationReference: { type: 'shared-annotation-reference', id: 'default-annotation' },
    //     normalizedPageUrl: 'getmemex.com',
    //     reply: { content: 'annot in getmemex.com - default - reply two (should be marked as seen)' },
    //     previousReplyReference: reply3Ref,
    // }) as SuccessReplyRes
    // const { replyReference: reply5Ref } = await services.contentConversations.submitReply({
    //     pageCreatorReference: { type: 'user-reference', id: 'default-user' },
    //     annotationReference: { type: 'shared-annotation-reference', id: 'second-annotation' },
    //     normalizedPageUrl: 'getmemex.com',
    //     reply: { content: 'annot in getmemex.com - second - reply one (should be marked as seen)' },
    //     previousReplyReference: reply4Ref,
    // }) as SuccessReplyRes
    // const { replyReference: reply6Ref } = await services.contentConversations.submitReply({
    //     pageCreatorReference: { type: 'user-reference', id: 'default-user' },
    //     annotationReference: { type: 'shared-annotation-reference', id: 'default-annotation' },
    //     normalizedPageUrl: 'getmemex.com',
    //     reply: { content: 'annot in getmemex.com - default - reply three (should be marked as seen)' },
    //     previousReplyReference: reply5Ref,
    // }) as SuccessReplyRes

    // we're following this list, so these should be in the stream, but marked as read because
    // of the timestamp we'll set later
    // await storage.serverModules.contentSharing.createListEntries({
    //     listReference: { type: 'shared-list-reference', id: 'default-list' },
    //     listEntries: [
    //         { createdWhen: Date.now() - (1000 * 60 * 60 * 4), entryTitle: 'New.com - page one (should be marked as seen)', normalizedUrl: 'new.com/one', originalUrl: 'https://www.new.com/one' },
    //         { createdWhen: Date.now() - (1000 * 60 * 60 * 3), entryTitle: 'New.com - page two (should be marked as seen)', normalizedUrl: 'new.com/two', originalUrl: 'https://www.new.com/two' },
    //         { createdWhen: Date.now() - (1000 * 60 * 60 * 2), entryTitle: 'New.com - page three (should be marked as seen)', normalizedUrl: 'new.com/three', originalUrl: 'https://www.new.com/three' },
    //     ],
    //     userReference: services.auth.getCurrentUserReference()!
    // })

    // we're still logged in as the second user here even we're modifying the timestamp of the default user
    // await storage.serverModules.activityStreams.updateHomeFeedTimestamp({
    //     user: { type: 'user-reference', id: 'default-user' },
    //     timestamp: Date.now(),
    // })

    // const { replyReference: reply7Ref } = await services.contentConversations.submitReply({
    //     pageCreatorReference: { type: 'user-reference', id: 'default-user' },
    //     annotationReference: { type: 'shared-annotation-reference', id: 'third-annotation' },
    //     normalizedPageUrl: 'notion.so',
    //     reply: { content: 'annot in notion.so - third - reply three (should show up as new)' },
    //     previousReplyReference: reply2Ref,
    // }) as SuccessReplyRes

    // await services.contentConversations.submitReply({
    //     pageCreatorReference: { type: 'user-reference', id: 'default-user' },
    //     annotationReference: { type: 'shared-annotation-reference', id: 'default-annotation' },
    //     normalizedPageUrl: 'getmemex.com',
    //     reply: { content: 'annot in getmemex.com - default - reply four (should show up as new)' },
    //     previousReplyReference: reply6Ref,
    // })

    // await storage.serverModules.contentSharing.createListEntries({
    //     listReference: { type: 'shared-list-reference', id: 'default-list' },
    //     listEntries: [
    //         { createdWhen: Date.now() - (1000 * 60 * 60 * 1), entryTitle: 'New.com - page four (should be new)', normalizedUrl: 'new.com/four', originalUrl: 'https://www.new.com/four' },
    //         { createdWhen: Date.now() - (1000 * 60 * 60 * 0), entryTitle: 'New.com - page five (should be new)', normalizedUrl: 'new.com/five', originalUrl: 'https://www.new.com/five' },
    //     ],
    //     userReference: services.auth.getCurrentUserReference()!
    // })

    // this page was already in the list before
    // await storage.serverModules.contentSharing.createPageInfo({
    //     creatorReference: services.auth.getCurrentUserReference()!,
    //     pageInfo: {
    //         fullTitle: 'New page',
    //         normalizedUrl: 'new.com/one',
    //         originalUrl: 'https://new.com/one',
    //     }
    // })

    // should be visible if expanded, but not generate new activities
    // const { sharedAnnotationReferences } = await storage.serverModules.contentSharing.createAnnotations({
    //     creator: services.auth.getCurrentUserReference()!,
    //     listReferences: [{ type: 'shared-list-reference', id: 'default-list' }],
    //     annotationsByPage: {
    //         ['new.com/one']: [
    //             { createdWhen: Date.now(), comment: 'test note', localId: 'test-annot-1' },
    //         ]
    //     }
    // })
    // const { replyReference: reply8Ref } = await services.contentConversations.submitReply({
    //     pageCreatorReference: services.auth.getCurrentUserReference()!,
    //     annotationReference: sharedAnnotationReferences['test-annot-1'],
    //     normalizedPageUrl: 'new.com/one',
    //     reply: { content: 'annot in new.com/one - first reply' }
    // }) as SuccessReplyRes
    // const { replyReference: reply9Ref } = await services.contentConversations.submitReply({
    //     pageCreatorReference: services.auth.getCurrentUserReference()!,
    //     annotationReference: sharedAnnotationReferences['test-annot-1'],
    //     normalizedPageUrl: 'new.com/one',
    //     reply: { content: 'annot in new.com/one - second reply' },
    //     previousReplyReference: reply8Ref,
    // }) as SuccessReplyRes

    // switch user
    // await services.auth.logout()
    // await services.auth.loginWithEmailPassword({
    //     email: 'default-user',
    //     password: 'bling'
    // })

    // should be visible if expanded
    // await services.contentConversations.submitReply({
    //     pageCreatorReference: { type: 'user-reference', id: 'default-user' },
    //     annotationReference: { type: 'shared-annotation-reference', id: 'third-annotation' },
    //     normalizedPageUrl: 'notion.so',
    //     reply: { content: 'annot in notion.so - third - reply four (to myself, should be hidden)' },
    //     previousReplyReference: reply7Ref,
    // })

    // await services.contentConversations.submitReply({
    //     pageCreatorReference: services.auth.getCurrentUserReference()!,
    //     annotationReference: sharedAnnotationReferences['test-annot-1'],
    //     normalizedPageUrl: 'new.com/one',
    //     reply: { content: 'annot in new.com/one - third reply' },
    //     previousReplyReference: reply9Ref
    // })
}
