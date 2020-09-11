import expect from 'expect'
import range from 'lodash/range'
import { SharedListEntry, SharedAnnotation } from "@worldbrain/memex-common/lib/content-sharing/types";
import { createStorageTestSuite } from "../../../../../tests/storage-tests";
import { TestLogicContainer } from "../../../../../tests/ui-logic";
import CollectionDetailsLogic, { CollectionDetailsState } from "./logic";
import CallModifier from '../../../../../utils/call-modifier';
import { CollectionDetailsEvent } from './types';

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

    createAnnotation(normalizedPageUrl: string): Omit<SharedAnnotation, 'normalizedPageUrl' | 'updatedWhen' | 'uploadedWhen'> & { localId: string } {
        const createdWhen = ++this.createdWhen;
        const number = this._getNextObjectNumber('listEntry')
        return {
            createdWhen: createdWhen,
            localId: `${normalizedPageUrl}#${createdWhen}`,
            body: `Body ${number}`,
            comment: `Comment ${number}`,
            selector: `Selector ${number}`
        }
    }

    _getNextObjectNumber(type: string) {
        if (!this.objectCounts[type]) {
            this.objectCounts[type] = 0
        }
        return ++this.objectCounts[type]
    }
}

// just for code formatting purposes
const description = (s: string) => s

createStorageTestSuite('Collection details logic', ({ it }) => {
    it('should load all annotations for a page', { withTestUser: true }, async ({ storage, services }) => {
        const contentSharing = storage.serverModules.contentSharing;
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
        await contentSharing.createAnnotations({
            creator: userReference,
            listReferences: [listReference],
            annotationsByPage: { [firstListEntry.normalizedUrl]: range(15).map(() => testDataFactory.createAnnotation(firstListEntry.normalizedUrl)) },
        })
        const logic = new CollectionDetailsLogic({
            contentSharing: storage.serverModules.contentSharing,
            userManagement: storage.serverModules.users,
            listID: storage.serverModules.contentSharing.getSharedListLinkID(listReference),
        });
        const container = new TestLogicContainer<CollectionDetailsState, CollectionDetailsEvent>(logic)
        await container.init()

        const callModifier = new CallModifier()
        const getAnnotationModification = callModifier.rawModify(
            contentSharing, 'getAnnotations', 'block'
        )
        await container.processEvent('togglePageAnnotations', { normalizedUrl: firstListEntry.normalizedUrl })
        expect(container.state).toEqual(expect.objectContaining({
            pageAnnotationsExpanded: {
                [firstListEntry.normalizedUrl]: true,
            },
            annotationLoadStates: {
                [firstListEntry.normalizedUrl]: 'running',
            },
            annotations: {}
        }))

        getAnnotationModification.unblockOldest()
        expect(container.state).toEqual(expect.objectContaining({
            pageAnnotationsExpanded: {
                [firstListEntry.normalizedUrl]: true,
            },
            annotationLoadStates: {
                [firstListEntry.normalizedUrl]: 'running',
            },
            annotations: {}
        }))

        getAnnotationModification.unblockOldest()
        await logic.pageAnnotationPromises[firstListEntry.normalizedUrl]
        expect(container.state).toEqual(expect.objectContaining({
            pageAnnotationsExpanded: {
                [firstListEntry.normalizedUrl]: true,
            },
            annotationLoadStates: {
                [firstListEntry.normalizedUrl]: 'success',
            },
        }))
        expect({ annotationCount: Object.keys(container.state.annotations).length }).toEqual({
            annotationCount: 15
        })
    })

    it(description(
        `should load all annotations for a page also when` +
        `multiple annotation entries exist for the same annotation`
    ), { withTestUser: true }, async ({ storage, services }) => {
        const contentSharing = storage.serverModules.contentSharing;
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

        const testAnnotations = range(15).map(() => testDataFactory.createAnnotation(firstListEntry.normalizedUrl));
        const { sharedAnnotationReferences } = await contentSharing.createAnnotations({
            creator: userReference,
            listReferences: [listReference],
            annotationsByPage: { [firstListEntry.normalizedUrl]: testAnnotations },
        })
        await contentSharing.addAnnotationsToLists({
            creator: userReference,
            sharedAnnotations: [{
                createdWhen: Date.now(),
                normalizedPageUrl: firstListEntry.normalizedUrl,
                reference: sharedAnnotationReferences[testAnnotations[0].localId]
            }],
            sharedListReferences: [listReference]
        })

        const logic = new CollectionDetailsLogic({
            contentSharing: storage.serverModules.contentSharing,
            userManagement: storage.serverModules.users,
            listID: storage.serverModules.contentSharing.getSharedListLinkID(listReference),
        });
        const container = new TestLogicContainer<CollectionDetailsState, CollectionDetailsEvent>(logic)
        await container.init()
        await container.processEvent('togglePageAnnotations', { normalizedUrl: firstListEntry.normalizedUrl })

        await logic.pageAnnotationPromises[firstListEntry.normalizedUrl]
        expect(container.state).toEqual(expect.objectContaining({
            pageAnnotationsExpanded: {
                [firstListEntry.normalizedUrl]: true,
            },
            annotationLoadStates: {
                [firstListEntry.normalizedUrl]: 'success',
            },
        }))
        expect({ annotationCount: Object.keys(container.state.annotations).length }).toEqual({
            annotationCount: 15
        })
    })
})
