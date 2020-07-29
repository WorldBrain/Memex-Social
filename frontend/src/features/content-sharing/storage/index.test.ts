import sortBy from 'lodash/sortBy'
import expect from 'expect'
import { createStorageTestSuite } from '../../../tests/storage-tests'

createStorageTestSuite('Content sharing storage', ({ it }) => {
    it('should save lists and retrieve them', { withTestUser: true }, async ({ storage, services }) => {
        const { contentSharing } = storage.serverModules
        const userReference = services.auth.getCurrentUserReference()!
        const listReference = await contentSharing.createSharedList({
            listData: {
                title: 'My list'
            },
            localListId: 55,
            userReference
        })
        const retrieved = await contentSharing.retrieveList(listReference)
        expect(retrieved).toEqual({
            creator: userReference,
            sharedList: expect.objectContaining({
                id: expect.anything(),
                creator: userReference.id,
                createdWhen: expect.any(Number),
                updatedWhen: expect.any(Number),
                title: 'My list',
            }),
            entries: []
        })
        expect(await storage.serverStorageManager.collection('sharedListCreatorInfo').findObjects({
            creator: userReference.id,
        })).toEqual([{
            id: expect.anything(),
            creator: userReference.id,
            sharedList: (listReference as any).id,
            localListId: 55,
        }])
    })

    it('should update list titles', { withTestUser: true }, async ({ storage, services }) => {
        const { contentSharing } = storage.serverModules
        const userReference = services.auth.getCurrentUserReference()!
        const listReference = await contentSharing.createSharedList({
            listData: {
                title: 'My list'
            },
            localListId: 55,
            userReference
        })
        await contentSharing.updateListTitle(listReference, 'Updated list title')
        const retrieved = await contentSharing.retrieveList(listReference)
        expect(retrieved).toEqual({
            creator: userReference,
            sharedList: expect.objectContaining({
                id: expect.anything(),
                creator: userReference.id,
                createdWhen: expect.any(Number),
                updatedWhen: expect.any(Number),
                title: 'Updated list title',
            }),
            entries: []
        })
    })

    it('should save list entries and retrieve them', { withTestUser: true }, async ({ storage, services }) => {
        const { contentSharing } = storage.serverModules
        const userReference = services.auth.getCurrentUserReference()!
        const listReference = await contentSharing.createSharedList({
            listData: {
                title: 'My list'
            },
            localListId: 55,
            userReference
        })
        await contentSharing.createListEntries({
            listReference,
            listEntries: [
                {
                    entryTitle: 'Page 1',
                    originalUrl: 'https://www.foo.com/page-1',
                    normalizedUrl: 'foo.com/page-1',
                },
                {
                    entryTitle: 'Page 2',
                    originalUrl: 'https://www.bar.com/page-2',
                    normalizedUrl: 'bar.com/page-2',
                    createdWhen: 592,
                },
            ],
            userReference
        })
        const retrieved = (await contentSharing.retrieveList(listReference))!
        retrieved.entries = sortBy(retrieved.entries, 'entryTitle')
        expect(retrieved).toEqual({
            creator: userReference,
            sharedList: expect.objectContaining({
                id: expect.anything(),
                creator: userReference.id,
                createdWhen: expect.any(Number),
                updatedWhen: expect.any(Number),
                title: 'My list',
            }),
            entries: [
                {
                    id: expect.anything(),
                    creator: userReference.id,
                    sharedList: listReference,
                    createdWhen: expect.any(Number),
                    updatedWhen: expect.any(Number),
                    entryTitle: 'Page 1',
                    originalUrl: 'https://www.foo.com/page-1',
                    normalizedUrl: 'foo.com/page-1',
                },
                {
                    id: expect.anything(),
                    creator: userReference.id,
                    sharedList: listReference,
                    createdWhen: 592,
                    updatedWhen: expect.any(Number),
                    entryTitle: 'Page 2',
                    originalUrl: 'https://www.bar.com/page-2',
                    normalizedUrl: 'bar.com/page-2',
                },
            ]
        })
    })

    it('should remove list entries', { withTestUser: true }, async ({ storage, services }) => {
        const { contentSharing } = storage.serverModules
        const userReference = services.auth.getCurrentUserReference()!
        const listReference = await contentSharing.createSharedList({
            listData: {
                title: 'My list'
            },
            localListId: 55,
            userReference
        })
        await contentSharing.createListEntries({
            listReference,
            listEntries: [
                {
                    entryTitle: 'Page 1',
                    originalUrl: 'https://www.foo.com/page-1',
                    normalizedUrl: 'foo.com/page-1',
                },
                {
                    entryTitle: 'Page 2',
                    originalUrl: 'https://www.bar.com/page-2',
                    normalizedUrl: 'bar.com/page-2',
                    createdWhen: 592,
                },
            ],
            userReference
        })
        await contentSharing.removeListEntries({
            listReference,
            normalizedUrl: 'bar.com/page-2'
        })

        const retrieved = (await contentSharing.retrieveList(listReference))!
        expect(retrieved).toEqual({
            creator: userReference,
            sharedList: expect.objectContaining({
                title: 'My list',
            }),
            entries: [
                expect.objectContaining({
                    entryTitle: 'Page 1',
                    normalizedUrl: 'foo.com/page-1',
                }),
            ]
        })
    })

    it('should store and retrieve annotations', { withTestUser: true }, async ({ storage, services }) => {
        const { contentSharing } = storage.serverModules
        const userReference = services.auth.getCurrentUserReference()!
        const listReference = await contentSharing.createSharedList({
            listData: {
                title: 'My list'
            },
            localListId: 55,
            userReference
        })
        await contentSharing.createListEntries({
            listReference,
            listEntries: [
                {
                    entryTitle: 'Page 1',
                    originalUrl: 'https://www.foo.com/page-1',
                    normalizedUrl: 'foo.com/page-1',
                },
                {
                    entryTitle: 'Page 2',
                    originalUrl: 'https://www.bar.com/page-2',
                    normalizedUrl: 'bar.com/page-2',
                    createdWhen: 592,
                },
            ],
            userReference
        })
        await contentSharing.createAnnotations({
            listReferences: [listReference],
            creator: userReference,
            annotationsByPage: {
                'foo.com/page-1': [
                    {
                        createdWhen: 500,
                        body: 'Body 1',
                        comment: 'Comment 1',
                        selector: 'Selector 1',
                    },
                    {
                        createdWhen: 1500,
                        body: 'Body 2',
                        comment: 'Comment 2',
                        selector: 'Selector 2',
                    },
                ],
                'bar.com/page-2': [
                    {
                        createdWhen: 2000,
                        body: 'Body 3',
                        comment: 'Comment 3',
                        selector: 'Selector 3',
                    },
                ],
            }
        })
        expect(await contentSharing.getAnnotationsForPagesInList({
            listReference,
            normalizedPageUrls: ['foo.com/page-1', 'bar.com/page-2']
        })).toEqual({
            "foo.com/page-1": [
                {
                    annotation: {
                        id: expect.anything(),
                        createdWhen: 500,
                        uploadedWhen: expect.any(Number),
                        updatedWhen: expect.any(Number),
                        creator: userReference.id,
                        normalizedPageUrl: "foo.com/page-1",
                        body: "Body 1",
                        comment: "Comment 1",
                        selector: "Selector 1",
                    },
                },
                {
                    annotation: {
                        id: expect.anything(),
                        createdWhen: 1500,
                        uploadedWhen: expect.any(Number),
                        updatedWhen: expect.any(Number),
                        creator: userReference.id,
                        normalizedPageUrl: "foo.com/page-1",
                        body: "Body 2",
                        comment: "Comment 2",
                        selector: "Selector 2",
                    },
                },
            ],
            'bar.com/page-2': [
                {
                    annotation: {
                        id: expect.anything(),
                        createdWhen: 2000,
                        uploadedWhen: expect.any(Number),
                        updatedWhen: expect.any(Number),
                        creator: userReference.id,
                        normalizedPageUrl: "bar.com/page-2",
                        body: "Body 3",
                        comment: "Comment 3",
                        selector: "Selector 3",
                    },
                }
            ],
        })
    })
})
