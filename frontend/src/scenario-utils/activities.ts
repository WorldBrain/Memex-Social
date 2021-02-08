import { Storage } from "../storage/types"
import { Services } from "../services/types"
import { ConversationReplyReference } from "@worldbrain/memex-common/lib/content-conversations/types"

type SuccessReplyRes = { status: 'success', replyReference: ConversationReplyReference }

export const setupTestActivities = async ({ services, storage }: { services: Services, storage: Storage }) => {
    await services.auth.loginWithEmailPassword({
        email: 'default-user',
        password: 'bling'
    })
    const { replyReference: reply1Ref } = await services.contentConversations.submitReply({
        pageCreatorReference: { type: 'user-reference', id: 'default-user' },
        annotationReference: { type: 'shared-annotation-reference', id: 'third-annotation' },
        normalizedPageUrl: 'notion.so',
        isFirstReply: true,
        reply: { content: 'Replying to myself' }
    }) as SuccessReplyRes
    await services.contentConversations.submitReply({
        pageCreatorReference: { type: 'user-reference', id: 'default-user' },
        annotationReference: { type: 'shared-annotation-reference', id: 'third-annotation' },
        normalizedPageUrl: 'notion.so',
        isFirstReply: false,
        reply: { content: 'Another reply to myself' },
        previousReplyReference: reply1Ref,
    })
    await services.activityStreams.followEntity({
        entityType: 'sharedAnnotation',
        entity: { type: 'shared-annotation-reference', id: 'default-annotation' },
        feeds: { home: true },
    })
    await services.activityStreams.followEntity({
        entityType: 'sharedAnnotation',
        entity: { type: 'shared-annotation-reference', id: 'second-annotation' },
        feeds: { home: true },
    })
    await services.activityStreams.followEntity({
        entityType: 'sharedAnnotation',
        entity: { type: 'shared-annotation-reference', id: 'third-annotation' },
        feeds: { home: true },
    })
    await storage.serverModules.activityFollows.storeFollow({
        userReference: services.auth.getCurrentUserReference()!,
        collection: 'sharedList',
        objectId: 'default-list'
    })
    await services.auth.logout()

    await services.auth.loginWithEmailPassword({
        email: 'two@user.com',
        password: 'bling'
    })
    await storage.serverModules.users.updateUser({
        type: 'user-reference', id: 'two@user.com'
    }, {
        knownStatus: 'exists'
    }, { displayName: 'User two' })
    const { replyReference: reply2Ref } = await services.contentConversations.submitReply({
        pageCreatorReference: { type: 'user-reference', id: 'default-user' },
        annotationReference: { type: 'shared-annotation-reference', id: 'default-annotation' },
        normalizedPageUrl: 'getmemex.com',
        reply: { content: 'default - reply one' }
    }) as SuccessReplyRes
    await services.contentConversations.submitReply({
        pageCreatorReference: { type: 'user-reference', id: 'default-user' },
        annotationReference: { type: 'shared-annotation-reference', id: 'default-annotation' },
        normalizedPageUrl: 'getmemex.com',
        reply: { content: 'default - reply two' },
        previousReplyReference: reply2Ref,
    })
    const { replyReference: reply4Ref } = await services.contentConversations.submitReply({
        pageCreatorReference: { type: 'user-reference', id: 'default-user' },
        annotationReference: { type: 'shared-annotation-reference', id: 'second-annotation' },
        normalizedPageUrl: 'getmemex.com',
        reply: { content: 'second - reply one' },
    }) as SuccessReplyRes
    const { replyReference: reply5Ref } = await services.contentConversations.submitReply({
        pageCreatorReference: { type: 'user-reference', id: 'default-user' },
        annotationReference: { type: 'shared-annotation-reference', id: 'default-annotation' },
        normalizedPageUrl: 'getmemex.com',
        reply: { content: 'default - reply three' },
        previousReplyReference: reply4Ref,
    }) as SuccessReplyRes
    await storage.serverModules.contentSharing.createListEntries({
        listReference: { type: 'shared-list-reference', id: 'default-list' },
        listEntries: [
            { createdWhen: Date.now() - (1000 * 60 * 60 * 4), entryTitle: 'New.com - page one', normalizedUrl: 'new.com/one', originalUrl: 'https://www.new.com/one' },
            { createdWhen: Date.now() - (1000 * 60 * 60 * 3), entryTitle: 'New.com - page two', normalizedUrl: 'new.com/two', originalUrl: 'https://www.new.com/two' },
            { createdWhen: Date.now() - (1000 * 60 * 60 * 2), entryTitle: 'New.com - page three', normalizedUrl: 'new.com/three', originalUrl: 'https://www.new.com/three' },
        ],
        userReference: services.auth.getCurrentUserReference()!
    })
    await storage.serverModules.activityStreams.updateHomeFeedTimestamp({
        user: { type: 'user-reference', id: 'default-user' },
        timestamp: Date.now(),
    })
    const { replyReference: reply6Ref } = await services.contentConversations.submitReply({
        pageCreatorReference: { type: 'user-reference', id: 'default-user' },
        annotationReference: { type: 'shared-annotation-reference', id: 'third-annotation' },
        normalizedPageUrl: 'notion.so',
        reply: { content: 'third - reply one' },
        previousReplyReference: reply5Ref,
    }) as SuccessReplyRes
    await services.contentConversations.submitReply({
        pageCreatorReference: { type: 'user-reference', id: 'default-user' },
        annotationReference: { type: 'shared-annotation-reference', id: 'default-annotation' },
        normalizedPageUrl: 'getmemex.com',
        reply: { content: 'default - reply four' },
        previousReplyReference: reply6Ref,
    })
    await storage.serverModules.contentSharing.createListEntries({
        listReference: { type: 'shared-list-reference', id: 'default-list' },
        listEntries: [
            { createdWhen: Date.now() - (1000 * 60 * 60 * 1), entryTitle: 'New.com - page four', normalizedUrl: 'new.com/four', originalUrl: 'https://www.new.com/four' },
            { createdWhen: Date.now() - (1000 * 60 * 60 * 0), entryTitle: 'New.com - page five', normalizedUrl: 'new.com/five', originalUrl: 'https://www.new.com/five' },
        ],
        userReference: services.auth.getCurrentUserReference()!
    })
    await storage.serverModules.contentSharing.createAnnotations({
        creator: services.auth.getCurrentUserReference()!,
        listReferences: [{ type: 'shared-list-reference', id: 'default-list' }],
        annotationsByPage: {
            ['new.com/one']: [
                { createdWhen: Date.now(), comment: 'test note', localId: 'test-annot-1' },
            ]
        }
    })
    await services.auth.logout()

    await services.auth.loginWithEmailPassword({
        email: 'default-user',
        password: 'bling'
    })

    await services.contentConversations.submitReply({
        pageCreatorReference: { type: 'user-reference', id: 'default-user' },
        annotationReference: { type: 'shared-annotation-reference', id: 'third-annotation' },
        normalizedPageUrl: 'notion.so',
        reply: { content: 'My final reply to myself' }
    })
}
