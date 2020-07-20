import sortBy from 'lodash/sortBy'
import expect from 'expect'
import { createStorageTestSuite } from '../../../tests/storage-tests'

createStorageTestSuite('Content sharing storage', ({ it }) => {
    it('should save lists and retrieve them', async ({ storage, services, auth }) => {
        const { contentSharing } = storage.serverModules
        await auth.signInTestUser()
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

    it('should update list titles', async ({ storage, services, auth }) => {
        const { contentSharing } = storage.serverModules
        await auth.signInTestUser()
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

    it('should save list entries and retrieve them', async ({ storage, services, auth }) => {
        const { contentSharing } = storage.serverModules
        await auth.signInTestUser()
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
})
