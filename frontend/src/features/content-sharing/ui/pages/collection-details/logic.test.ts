import expect from 'expect'
import range from 'lodash/range'
import {
    SharedListEntry,
    SharedAnnotation,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import {
    createStorageTestSuite,
    StorageTestContext,
} from '../../../../../tests/storage-tests'
import { TestLogicContainer } from '../../../../../tests/ui-logic'
import CollectionDetailsLogic from './logic'
import CallModifier from '../../../../../utils/call-modifier'
import { CollectionDetailsEvent, CollectionDetailsState } from './types'

class TestDataFactory {
    createdWhen = 0
    objectCounts: { [type: string]: number } = {}

    createListEntry(): Omit<SharedListEntry, 'updatedWhen'> {
        const createdWhen = ++this.createdWhen
        const number = this._getNextObjectNumber('listEntry')
        return {
            createdWhen: createdWhen,
            entryTitle: `Entry ${number}`,
            normalizedUrl: `foo.com/page-${number}`,
            originalUrl: `https://www.foo.com/page-${number}`,
        }
    }

    createAnnotation(
        normalizedPageUrl: string,
    ): Omit<
        SharedAnnotation,
        'normalizedPageUrl' | 'updatedWhen' | 'uploadedWhen'
    > & { localId: string } {
        const createdWhen = ++this.createdWhen
        const number = this._getNextObjectNumber('listEntry')
        return {
            createdWhen: createdWhen,
            localId: `${normalizedPageUrl}#${createdWhen}`,
            body: `Body ${number}`,
            comment: `Comment ${number}`,
            selector: `Selector ${number}`,
        }
    }

    _getNextObjectNumber(type: string) {
        if (!this.objectCounts[type]) {
            this.objectCounts[type] = 0
        }
        return ++this.objectCounts[type]
    }
}

async function setupTest(context: Pick<StorageTestContext, 'services'>) {
    context.services.router.matchCurrentUrl = () => ({
        route: 'collectionDetails',
        params: {},
    })
    context.services.router.getQueryParam = () => null
}

// just for code formatting purposes
const description = (s: string) => s

createStorageTestSuite('Collection details logic', ({ it }) => {
    it(
        'should load all annotations for a page',
        { withTestUser: true },
        async ({ storage, services }) => {
            await setupTest({ services })
            const contentSharing = storage.serverModules.contentSharing
            const userReference = services.auth.getCurrentUserReference()!
            const listReference = await contentSharing.createSharedList({
                userReference,
                listData: { title: 'Test list' },
            })

            const testDataFactory = new TestDataFactory()
            const firstListEntry = testDataFactory.createListEntry()
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
                annotationsByPage: {
                    [firstListEntry.normalizedUrl]: range(15).map(() =>
                        testDataFactory.createAnnotation(
                            firstListEntry.normalizedUrl,
                        ),
                    ),
                },
            })
            const logic = new CollectionDetailsLogic({
                storageManager: storage.serverStorageManager,
                storage: storage.serverModules,
                services,
                listID: storage.serverModules.contentSharing.getSharedListLinkID(
                    listReference,
                ),
                query: {},
                imageSupport: null as any,
            })
            const container = new TestLogicContainer<
                CollectionDetailsState,
                CollectionDetailsEvent
            >(logic)
            await container.init()

            const callModifier = new CallModifier()
            const getAnnotationModification = callModifier.rawModify(
                contentSharing,
                'getAnnotations',
                'block',
            )
            await container.processEvent('togglePageAnnotations', {
                normalizedUrl: firstListEntry.normalizedUrl,
            })
            expect(container.state).toEqual(
                expect.objectContaining({
                    pageAnnotationsExpanded: {
                        [firstListEntry.normalizedUrl]: true,
                    },
                    annotationLoadStates: {
                        [firstListEntry.normalizedUrl]: 'running',
                    },
                    annotations: {},
                }),
            )

            getAnnotationModification.unblockOldest()
            expect(container.state).toEqual(
                expect.objectContaining({
                    pageAnnotationsExpanded: {
                        [firstListEntry.normalizedUrl]: true,
                    },
                    annotationLoadStates: {
                        [firstListEntry.normalizedUrl]: 'running',
                    },
                    annotations: {},
                }),
            )

            getAnnotationModification.unblockOldest()
            await logic.pageAnnotationPromises[firstListEntry.normalizedUrl]
            expect(container.state).toEqual(
                expect.objectContaining({
                    pageAnnotationsExpanded: {
                        [firstListEntry.normalizedUrl]: true,
                    },
                    annotationLoadStates: {
                        [firstListEntry.normalizedUrl]: 'success',
                    },
                }),
            )
            expect({
                annotationCount: Object.keys(container.state.annotations)
                    .length,
            }).toEqual({
                annotationCount: 15,
            })
        },
    )

    it(
        description(
            `should load all annotations for a page also when` +
                `multiple annotation entries exist for the same annotation`,
        ),
        { withTestUser: true },
        async ({ storage, services }) => {
            await setupTest({ services })
            const contentSharing = storage.serverModules.contentSharing
            const userReference = services.auth.getCurrentUserReference()!
            const listReference = await contentSharing.createSharedList({
                userReference,
                listData: { title: 'Test list' },
            })

            const testDataFactory = new TestDataFactory()
            const firstListEntry = testDataFactory.createListEntry()
            await contentSharing.createListEntries({
                userReference,
                listReference,
                listEntries: [
                    firstListEntry,
                    testDataFactory.createListEntry(),
                ],
            })

            const testAnnotations = range(15).map(() =>
                testDataFactory.createAnnotation(firstListEntry.normalizedUrl),
            )
            const {
                sharedAnnotationReferences,
            } = await contentSharing.createAnnotations({
                creator: userReference,
                listReferences: [listReference],
                annotationsByPage: {
                    [firstListEntry.normalizedUrl]: testAnnotations,
                },
            })
            await contentSharing.addAnnotationsToLists({
                creator: userReference,
                sharedAnnotations: [
                    {
                        createdWhen: Date.now(),
                        normalizedPageUrl: firstListEntry.normalizedUrl,
                        reference:
                            sharedAnnotationReferences[
                                testAnnotations[0].localId
                            ],
                    },
                ],
                sharedListReferences: [listReference],
            })

            const logic = new CollectionDetailsLogic({
                storageManager: storage.serverStorageManager,
                storage: storage.serverModules,
                services,
                listID: storage.serverModules.contentSharing.getSharedListLinkID(
                    listReference,
                ),
                query: {},
                imageSupport: null as any,
            })
            const container = new TestLogicContainer<
                CollectionDetailsState,
                CollectionDetailsEvent
            >(logic)
            await container.init()
            await container.processEvent('togglePageAnnotations', {
                normalizedUrl: firstListEntry.normalizedUrl,
            })

            await logic.pageAnnotationPromises[firstListEntry.normalizedUrl]
            expect(container.state).toEqual(
                expect.objectContaining({
                    pageAnnotationsExpanded: {
                        [firstListEntry.normalizedUrl]: true,
                    },
                    annotationLoadStates: {
                        [firstListEntry.normalizedUrl]: 'success',
                    },
                }),
            )
            expect({
                annotationCount: Object.keys(container.state.annotations)
                    .length,
            }).toEqual({
                annotationCount: 15,
            })
        },
    )

    it(
        'should be able to follow and unfollow the current list',
        { withTestUser: true },
        async ({ storage, services }) => {
            await setupTest({ services })
            const contentSharing = storage.serverModules.contentSharing
            const userReference = services.auth.getCurrentUserReference()!
            const listReference = await contentSharing.createSharedList({
                userReference,
                listData: { title: 'Test list' },
            })

            const testDataFactory = new TestDataFactory()
            const firstListEntry = testDataFactory.createListEntry()
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
                annotationsByPage: {
                    [firstListEntry.normalizedUrl]: range(15).map(() =>
                        testDataFactory.createAnnotation(
                            firstListEntry.normalizedUrl,
                        ),
                    ),
                },
            })

            const listID = storage.serverModules.contentSharing.getSharedListLinkID(
                listReference,
            )

            // Login as another user, so we can click the follow btn
            await services.auth.loginWithEmailPassword({
                email: 'yo@gmail.com',
                password: '123',
            })

            const logic = new CollectionDetailsLogic({
                storageManager: storage.serverStorageManager,
                storage: storage.serverModules,
                services,
                listID,
                query: {},
                imageSupport: null as any,
            })
            const container = new TestLogicContainer<
                CollectionDetailsState,
                CollectionDetailsEvent
            >(logic)
            await container.init()

            const entityArgs = {
                userReference: services.auth.getCurrentUserReference()!,
                collection: 'sharedList',
                objectId: listID,
            }

            expect(
                await storage.serverModules.activityFollows.isEntityFollowedByUser(
                    entityArgs,
                ),
            ).toBe(false)
            expect(container.state.isCollectionFollowed).toBe(false)
            expect(container.state.followLoadState).toEqual('success')
            // expect(container.state.followedLists).toEqual([])

            const followP = container.processEvent('clickFollowBtn', {})
            expect(container.state.followLoadState).toEqual('running')
            await followP

            expect(
                await storage.serverModules.activityFollows.isEntityFollowedByUser(
                    entityArgs,
                ),
            ).toBe(true)
            expect(container.state.isCollectionFollowed).toBe(true)
            expect(container.state.followLoadState).toEqual('success')
            const { list } = container.state.listData!
            // expect(container.state.followedLists).toEqual([
            //     {
            //         title: list.title,
            //         createdWhen: list.createdWhen,
            //         updatedWhen: list.updatedWhen,
            //         reference: { type: 'shared-list-reference', id: listID },
            //     },
            // ])

            const unfollowP = container.processEvent('clickFollowBtn', {})
            // TODO: we don't have a good way to block requests in tests yet so the next line would be guaranteed to be 'running'
            // expect(container.state.followLoadState).toEqual('running')
            await unfollowP

            expect(
                await storage.serverModules.activityFollows.isEntityFollowedByUser(
                    entityArgs,
                ),
            ).toBe(false)
            expect(container.state.isCollectionFollowed).toBe(false)
            expect(container.state.followLoadState).toEqual('success')
            // expect(container.state.followedLists).toEqual([])
        },
    )

    it(
        'should load follow button state on init',
        { withTestUser: true },
        async ({ storage, services }) => {
            await setupTest({ services })
            const { contentSharing, activityFollows } = storage.serverModules
            const userReference = services.auth.getCurrentUserReference()!
            const listReference = await contentSharing.createSharedList({
                userReference,
                listData: { title: 'Test list' },
            })

            const testDataFactory = new TestDataFactory()
            const firstListEntry = testDataFactory.createListEntry()
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
                annotationsByPage: {
                    [firstListEntry.normalizedUrl]: range(15).map(() =>
                        testDataFactory.createAnnotation(
                            firstListEntry.normalizedUrl,
                        ),
                    ),
                },
            })

            const listID = storage.serverModules.contentSharing.getSharedListLinkID(
                listReference,
            )

            await activityFollows.storeFollow({
                collection: 'sharedList',
                objectId: listID,
                userReference,
            })

            const logic = new CollectionDetailsLogic({
                storageManager: storage.serverStorageManager,
                storage: storage.serverModules,
                services,
                listID,
                query: {},
                imageSupport: null as any,
            })
            const container = new TestLogicContainer<
                CollectionDetailsState,
                CollectionDetailsEvent
            >(logic)

            expect(container.state.isCollectionFollowed).toEqual(false)
            expect(container.state.followLoadState).toEqual('running')

            const initP = logic['loadFollowBtnState']()

            expect(container.state.followLoadState).toEqual('running')

            await initP

            expect(container.state.isCollectionFollowed).toEqual(true)
            expect(container.state.followLoadState).toEqual('success')
        },
    )

    // it(
    //     'should load all followed lists on init',
    //     { withTestUser: true },
    //     async ({ storage, services }) => {
    //         await setupTest({ services })
    //         const { contentSharing, activityFollows } = storage.serverModules
    //         const userReference = services.auth.getCurrentUserReference()!
    //         const listReference = await contentSharing.createSharedList({
    //             userReference,
    //             listData: { title: 'Test list' },
    //         })

    //         const testDataFactory = new TestDataFactory()
    //         const firstListEntry = testDataFactory.createListEntry()
    //         await contentSharing.createListEntries({
    //             userReference,
    //             listReference,
    //             listEntries: [
    //                 firstListEntry,
    //                 testDataFactory.createListEntry(),
    //             ],
    //         })
    //         await activityFollows.storeFollow({
    //             userReference,
    //             collection: 'sharedList',
    //             objectId: listReference.id as string,
    //         })
    //         const listID = storage.serverModules.contentSharing.getSharedListLinkID(
    //             listReference,
    //         )

    //         const logic = new CollectionDetailsLogic({
    //             storageManager: storage.serverStorageManager,
    //             storage: storage.serverModules,
    //             services,
    //             listID,
    //             query: {},
    //             imageSupport: null as any,
    //         })
    //         const container = new TestLogicContainer<
    //             CollectionDetailsState,
    //             CollectionDetailsEvent
    //         >(logic)

    //         expect(container.state.listSidebarLoadState).toEqual('pristine')
    //         expect(container.state.followedLists).toEqual([])
    //         expect(container.state.isListSidebarShown).toEqual(false)

    //         const initP = container.processEvent(
    //             'initActivityFollows',
    //             undefined,
    //         )
    //         expect(container.state.listSidebarLoadState).toEqual('running')
    //         await initP

    //         expect(container.state.listSidebarLoadState).toEqual('success')
    //         expect(container.state.followedLists).toEqual([
    //             expect.objectContaining({
    //                 title: 'Test list',
    //                 reference: listReference,
    //                 creator: {
    //                     id: 'default-user',
    //                     type: 'user-reference',
    //                 },
    //             }),
    //         ])
    //         expect(container.state.isListSidebarShown).toEqual(true)
    //     },
    // )
})
