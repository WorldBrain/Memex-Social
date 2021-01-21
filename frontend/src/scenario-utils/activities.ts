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
        reply: { content: 'Test reply one' }
    })
    await services.contentConversations.submitReply({
        pageCreatorReference: { type: 'user-reference', id: 'default-user' },
        annotationReference: { type: 'shared-annotation-reference', id: 'default-annotation' },
        normalizedPageUrl: 'getmemex.com',
        isFirstReply: true,
        reply: { content: 'Test reply two' }
    })
    await services.contentConversations.submitReply({
        pageCreatorReference: { type: 'user-reference', id: 'default-user' },
        annotationReference: { type: 'shared-annotation-reference', id: 'second-annotation' },
        normalizedPageUrl: 'getmemex.com',
        isFirstReply: true,
        reply: { content: 'Test reply three' }
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
        reply: { content: 'Test reply four' }
    })
    await storage.serverModules.contentSharing.createListEntries({
        listReference: { type: 'shared-list-reference', id: 'default-list' },
        listEntries: [
            { createdWhen: Date.now(), entryTitle: 'New.com - page one', normalizedUrl: 'new.com/one', originalUrl: 'https://www.new.com/one' },
            { createdWhen: Date.now(), entryTitle: 'New.com - page two', normalizedUrl: 'new.com/two', originalUrl: 'https://www.new.com/two' },
        ],
        userReference: services.auth.getCurrentUserReference()!
    })
    await services.auth.logout()

    await services.auth.loginWithEmailPassword({
        email: 'default-user',
        password: 'bling'
    })
}
