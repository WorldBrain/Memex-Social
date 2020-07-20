import expect from 'expect'
import { createStorageTestSuite } from '../../../tests/storage-tests'

createStorageTestSuite('User management storage', ({ it }) => {
    it('should create a user profile for a new user', { withTestUser: true }, async ({ storage, services, auth }) => {
        const { users } = storage.serverModules
        const userReference = services.auth.getCurrentUserReference()!
        await users.updateUser(userReference, {}, {
            displayName: 'Joe Doe'
        })

        const retrieved = await users.getUser(userReference)
        expect(retrieved).toEqual(expect.objectContaining({
            displayName: 'Joe Doe'
        }))
    })

    it('should create a user profile for a new user', { withTestUser: true }, async ({ storage, services, auth }) => {
        const { users } = storage.serverModules
        const userReference = services.auth.getCurrentUserReference()!
        await users.updateUser(userReference, {}, {
            displayName: 'Joe Doe'
        })
        await users.updateUser(userReference, { knownStatus: 'exists' }, {
            displayName: 'Bob Doe'
        })

        const retrieved = await users.getUser(userReference)
        expect(retrieved).toEqual(expect.objectContaining({
            displayName: 'Bob Doe'
        }))
    })
})
