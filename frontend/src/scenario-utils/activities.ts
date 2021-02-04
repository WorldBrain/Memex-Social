import { Storage } from "../storage/types"
import { Services } from "../services/types"

export const setupTestActivities = async ({ services, storage }: { services: Services, storage: Storage }) => {
    await services.auth.loginWithEmailPassword({
        email: 'default-user',
        password: 'bling'
    })
    await services.contentConversations.submitReply({
        pageCreatorReference: { type: 'user-reference', id: 'default-user' },
        annotationReference: { type: 'shared-annotation-reference', id: 'third-annotation' },
        normalizedPageUrl: 'notion.so',
        isFirstReply: true,
        reply: { content: 'Replying to myself' }
    })
    await services.contentConversations.submitReply({
        pageCreatorReference: { type: 'user-reference', id: 'default-user' },
        annotationReference: { type: 'shared-annotation-reference', id: 'third-annotation' },
        normalizedPageUrl: 'notion.so',
        isFirstReply: false,
        reply: { content: 'Another reply to myself' }
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
    await services.contentConversations.submitReply({
        pageCreatorReference: { type: 'user-reference', id: 'default-user' },
        annotationReference: { type: 'shared-annotation-reference', id: 'default-annotation' },
        normalizedPageUrl: 'getmemex.com',
        isFirstReply: true,
        reply: { content: 'default - reply one' }
    })
    await services.contentConversations.submitReply({
        pageCreatorReference: { type: 'user-reference', id: 'default-user' },
        annotationReference: { type: 'shared-annotation-reference', id: 'default-annotation' },
        normalizedPageUrl: 'getmemex.com',
        isFirstReply: false,
        reply: { content: 'default - reply two' }
    })
    await services.contentConversations.submitReply({
        pageCreatorReference: { type: 'user-reference', id: 'default-user' },
        annotationReference: { type: 'shared-annotation-reference', id: 'second-annotation' },
        normalizedPageUrl: 'getmemex.com',
        isFirstReply: true,
        reply: { content: 'second - reply one' }
    })
    await services.contentConversations.submitReply({
        pageCreatorReference: { type: 'user-reference', id: 'default-user' },
        annotationReference: { type: 'shared-annotation-reference', id: 'default-annotation' },
        normalizedPageUrl: 'getmemex.com',
        isFirstReply: false,
        reply: { content: 'default - reply three' }
    })
    await storage.serverModules.contentSharing.createListEntries({
        listReference: { type: 'shared-list-reference', id: 'default-list' },
        listEntries: [
            { createdWhen: Date.now(), entryTitle: 'New.com - page one', normalizedUrl: 'new.com/one', originalUrl: 'https://www.new.com/one' },
            { createdWhen: Date.now(), entryTitle: 'New.com - page two', normalizedUrl: 'new.com/two', originalUrl: 'https://www.new.com/two' },
            { createdWhen: Date.now(), entryTitle: 'New.com - page three', normalizedUrl: 'new.com/three', originalUrl: 'https://www.new.com/three' },
        ],
        userReference: services.auth.getCurrentUserReference()!
    })
    await storage.serverModules.activityStreams.updateHomeFeedTimestamp({
        user: { type: 'user-reference', id: 'default-user' },
        timestamp: Date.now(),
    })
    await services.contentConversations.submitReply({
        pageCreatorReference: { type: 'user-reference', id: 'default-user' },
        annotationReference: { type: 'shared-annotation-reference', id: 'third-annotation' },
        normalizedPageUrl: 'notion.so',
        isFirstReply: false,
        reply: { content: 'third - reply one' }
    })
    await services.contentConversations.submitReply({
        pageCreatorReference: { type: 'user-reference', id: 'default-user' },
        annotationReference: { type: 'shared-annotation-reference', id: 'default-annotation' },
        normalizedPageUrl: 'getmemex.com',
        isFirstReply: false,
        reply: { content: 'default - reply four' }
    })
    await storage.serverModules.contentSharing.createListEntries({
        listReference: { type: 'shared-list-reference', id: 'default-list' },
        listEntries: [
            { createdWhen: Date.now(), entryTitle: 'New.com - page four', normalizedUrl: 'new.com/four', originalUrl: 'https://www.new.com/four' },
            { createdWhen: Date.now(), entryTitle: 'New.com - page five', normalizedUrl: 'new.com/five', originalUrl: 'https://www.new.com/five' },
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
}
