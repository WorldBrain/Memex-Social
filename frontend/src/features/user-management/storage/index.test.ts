import expect from 'expect'
import { createStorageTestSuite } from '../../../tests/storage-tests'

createStorageTestSuite('User management storage', ({ it }) => {
    it(
        'should create a user object for a new user',
        { withTestUser: true },
        async ({ storage, services, auth }) => {
            const { users } = storage.serverModules
            const userReference = services.auth.getCurrentUserReference()!
            await users.updateUser(
                userReference,
                {},
                {
                    displayName: 'Joe Doe',
                },
            )

            const retrieved = await users.getUser(userReference)
            expect(retrieved).toEqual(
                expect.objectContaining({
                    displayName: 'Joe Doe',
                }),
            )
        },
    )

    it(
        `should create a user object when trying to update a user object that doesn't exist yet`,
        { withTestUser: true },
        async ({ storage, services, auth }) => {
            const { users } = storage.serverModules
            const userReference = services.auth.getCurrentUserReference()!
            await users.updateUser(
                userReference,
                {},
                {
                    displayName: 'Joe Doe',
                },
            )
            await users.updateUser(
                userReference,
                { knownStatus: 'exists' },
                {
                    displayName: 'Bob Doe',
                },
            )

            const retrieved = await users.getUser(userReference)
            expect(retrieved).toEqual(
                expect.objectContaining({
                    displayName: 'Bob Doe',
                }),
            )
        },
    )

    it(
        'should create and update a public user profile for a new user',
        { withTestUser: true },
        async ({ storage, services, auth }) => {
            const { users } = storage.serverModules
            const userReference = services.auth.getCurrentUserReference()!

            await users.createOrUpdateUserPublicProfile(userReference, {}, {})
            const retrieved = await users.getUserPublicProfile(userReference)
            expect(retrieved).toEqual(expect.objectContaining({}))

            const profileData = {
                websiteURL: 'https://www.google.com',
                mediumURL: 'https://www.medium.com/@fortelabs',
                twitterURL: 'https://twitter.com/fortelabs',
                subStackURL:
                    'https://praxis.every.to/people/532856-tiago-forte',
                bio:
                    'Founder @fortelabs.co | Teaching @buildingasecondbrain.com | Writer @fortelabs.co/blog + the best productivity newsletter on the web: fortelabs.co/subscribe',
                paymentPointer: '',
                substackURL: '',
                avatarURL: '',
            }
            await users.createOrUpdateUserPublicProfile(
                userReference,
                { knownStatus: 'exists' },
                profileData,
            )
            const retrievedUpdated = await users.getUserPublicProfile(
                userReference,
            )
            expect(retrievedUpdated).toEqual(
                expect.objectContaining(profileData),
            )
        },
    )
})
