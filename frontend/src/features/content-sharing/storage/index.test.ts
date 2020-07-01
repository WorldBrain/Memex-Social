import expect from 'expect'
import { createStorageTestFactory } from '../../../tests/storage-tests'

describe('Content sharing storage', () => {
    const it = createStorageTestFactory()

    it('should save lists and retrieve them', async ({ storage }) => {
        const { contentSharing } = storage.serverModules
        const listReference = await contentSharing.createSharedList({
            title: 'My list'
        })
        const retrieved = await contentSharing.retrieveList(listReference)
        expect(retrieved).toEqual({
            sharedList: expect.objectContaining({
                title: 'My list',
                createdWhen: expect.any(Number),
                updatedWhen: expect.any(Number),
            }),
            entries: []
        })
    })
})
