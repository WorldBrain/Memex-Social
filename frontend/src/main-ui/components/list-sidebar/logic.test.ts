import expect from 'expect'
import { createStorageTestSuite, StorageTestContext } from "../../../tests/storage-tests";
import Logic from './logic'
import { State, Events } from './types'
import { TestLogicContainer } from "../../../tests/ui-logic";
import { SharedListEntry } from "@worldbrain/memex-common/lib/content-sharing/types";

class TestDataFactory {
    createdWhen = 0
    objectCounts: { [type: string]: number } = {}

    createListEntry(): Omit<SharedListEntry, 'updatedWhen'> {
        const createdWhen = ++this.createdWhen;
        const number = this._getNextObjectNumber('listEntry')
        return {
            createdWhen: createdWhen,
            entryTitle: `Entry ${number}`,
            normalizedUrl: `foo.com/page-${number}`,
            originalUrl: `https://www.foo.com/page-${number}`
        }
    }

    _getNextObjectNumber(type: string) {
        if (!this.objectCounts[type]) {
            this.objectCounts[type] = 0
        }
        return ++this.objectCounts[type]
    }
}


async function setupTest(context: StorageTestContext) {
    const logic = new Logic(context)
    const container = new TestLogicContainer<State, Events>(logic)

    return { container, logic }
}

createStorageTestSuite('List sidebar logic', ({ it }) => {
    it ('should load all followed lists on init', { withTestUser: true }, async (context) => {
        const { storage, services } = context

        const { contentSharing, activityFollows } = storage.serverModules
        const userReference = (services.auth.getCurrentUserReference()!);
        const listReference = await contentSharing.createSharedList({
            userReference,
            localListId: 33,
            listData: { title: 'Test list' },
        })

        const testDataFactory = new TestDataFactory()
        const firstListEntry = testDataFactory.createListEntry();
        await contentSharing.createListEntries({
            userReference,
            listReference,
            listEntries: [
                firstListEntry,
                testDataFactory.createListEntry(),
            ],
        })
        await activityFollows.storeFollow({
            userReference,
            collection: 'sharedList',
            objectId: listReference.id as string,
        })

        const { container } = await setupTest(context)

        expect(container.state.loadState).toEqual('pristine')
        expect(container.state.followedLists).toEqual([])
        expect(container.state.isListShown).toEqual(false)

        const initP = container.init()
        expect(container.state.loadState).toEqual('running')
        await initP

        expect(container.state.loadState).toEqual('success')
        expect(container.state.followedLists).toEqual([expect.objectContaining({
            title: 'Test list',
            creator: 'default-user',
            reference: listReference,
        })])
        expect(container.state.isListShown).toEqual(true)
    })

    it ('should re-route to selected list on sidebar list click', { withTestUser: true }, async (context) => {
        const { storage, services } = context

        const { contentSharing, activityFollows } = storage.serverModules
        const userReference = (services.auth.getCurrentUserReference()!);
        const listReference = await contentSharing.createSharedList({
            userReference,
            localListId: 33,
            listData: { title: 'Test list' },
        })

        const testDataFactory = new TestDataFactory()
        const firstListEntry = testDataFactory.createListEntry();
        await contentSharing.createListEntries({
            userReference,
            listReference,
            listEntries: [
                firstListEntry,
                testDataFactory.createListEntry(),
            ],
        })
        await activityFollows.storeFollow({
            userReference,
            collection: 'sharedList',
            objectId: listReference.id as string,
        })

        const { container } = await setupTest(context)

        await container.init()
        await container.processEvent('clickSharedList', { listReference })

        // TODO: implement a fake router history to be able to check the reroute
    })
})
