import expect from 'expect'

import { createStorageTestSuite } from '../../../tests/storage-tests'
import { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import { ActivityFollow } from '@worldbrain/memex-common/lib/activity-follows/storage/types'
import orderBy from 'lodash/orderBy'

createStorageTestSuite('Activity Following storage', ({ it }) => {
    it(
        'should be able to follow an entity',
        { withTestUser: true },
        async ({ storage, services }) => {
            const { activityFollows } = storage.serverModules
            const userReference = services.auth.getCurrentUserReference()!
            const createdWhen = new Date()

            const collection = 'sharedList'
            const objectId = 'list-a'

            expect(
                await storage.serverStorageManager
                    .collection('activityFollow')
                    .findObject({ collection, objectId }),
            ).toEqual(null)

            const {
                reference,
                userReference: userReferenceStored,
                ...follow
            } = await activityFollows.storeFollow({
                userReference,
                createdWhen,
                collection,
                objectId,
            })

            expect(
                await storage.serverStorageManager
                    .collection('activityFollow')
                    .findObject({ id: reference.id }),
            ).toEqual({
                ...follow,
                id: reference.id,
                user: userReferenceStored.id,
            })
        },
    )

    it(
        'should not create duplicate follow when following an already followed entity',
        { withTestUser: true },
        async ({ storage, services }) => {
            const { activityFollows } = storage.serverModules
            const userReference = services.auth.getCurrentUserReference()!
            const createdWhen = new Date()

            const collection = 'sharedList'
            const objectId = 'list-a'

            expect(
                await storage.serverStorageManager
                    .collection('activityFollow')
                    .findObject({ collection, objectId }),
            ).toEqual(null)

            const followA = await activityFollows.storeFollow({
                userReference,
                createdWhen,
                collection,
                objectId,
            })

            const followB = await activityFollows.storeFollow({
                userReference,
                createdWhen,
                collection,
                objectId,
            })

            expect(followA).toEqual(followB)
        },
    )

    it(
        'should be able to unfollow an entity',
        { withTestUser: true },
        async ({ storage, services }) => {
            const { activityFollows } = storage.serverModules
            const userReference = services.auth.getCurrentUserReference()!
            const createdWhen = new Date()

            const collection = 'sharedList'
            const objectId = 'list-a'

            const {
                reference,
                userReference: userReferenceStored,
                ...follow
            } = await activityFollows.storeFollow({
                userReference,
                createdWhen,
                collection,
                objectId,
            })

            expect(
                await storage.serverStorageManager
                    .collection('activityFollow')
                    .findObject({ id: reference.id }),
            ).toEqual({
                ...follow,
                id: reference.id,
                user: userReferenceStored.id,
            })

            await activityFollows.deleteFollow({
                userReference,
                collection,
                objectId,
            })

            expect(
                await storage.serverStorageManager
                    .collection('activityFollow')
                    .findObject({ id: reference.id }),
            ).toEqual(null)
        },
    )

    it(
        'should be able to get all followers for an entity',
        { withTestUser: false },
        async ({ storage, services }) => {
            const { activityFollows } = storage.serverModules
            const createdWhen = new Date()
            const collection = 'sharedList'
            const objectId = 'list-a'

            const userReferences: UserReference[] = [
                { type: 'user-reference', id: 'user-A' },
                { type: 'user-reference', id: 'user-B' },
                { type: 'user-reference', id: 'user-C' },
            ]

            for (const userReference of userReferences) {
                await activityFollows.storeFollow({
                    userReference,
                    createdWhen,
                    collection,
                    objectId,
                })
            }

            const followers = await activityFollows.getAllEntityFollowers({
                collection,
                objectId,
            })

            expect(followers).toEqual(userReferences)
        },
    )

    it(
        'should be able to check whether an entity is being followed by a user',
        { withTestUser: true },
        async ({ storage, services }) => {
            const { activityFollows } = storage.serverModules
            const userReference = services.auth.getCurrentUserReference()!
            const createdWhen = new Date()

            const collection = 'sharedList'
            const objectId = 'list-a'

            expect(
                await activityFollows.isEntityFollowedByUser({
                    userReference,
                    collection,
                    objectId,
                }),
            ).toBe(false)

            await activityFollows.storeFollow({
                userReference,
                createdWhen,
                collection,
                objectId,
            })

            expect(
                await activityFollows.isEntityFollowedByUser({
                    userReference,
                    collection,
                    objectId,
                }),
            ).toBe(true)
        },
    )

    it(
        'should be able to get all follows of specific collection types',
        { withTestUser: true },
        async ({ storage, services }) => {
            const { activityFollows } = storage.serverModules
            const userReference = services.auth.getCurrentUserReference()!
            const createdWhen = new Date()
            const collection = 'sharedList'
            const objectIds = ['list-a', 'list-b', 'list-c']

            const follows: ActivityFollow[] = []

            for (const objectId of objectIds) {
                const follow = await activityFollows.storeFollow({
                    userReference,
                    createdWhen,
                    collection,
                    objectId,
                })

                follows.push(follow)
            }

            const followsOfCollection = await activityFollows.getAllFollowsByCollection(
                {
                    collection,
                    userReference,
                },
            )

            expect(orderBy(followsOfCollection, ['objectId', 'asc'])).toEqual(
                orderBy(follows, ['objectId', 'asc']),
            )
        },
    )

    it(
        'should be able to get all follows of specific entity',
        { withTestUser: false },
        async ({ storage, services }) => {
            const { activityFollows } = storage.serverModules
            const createdWhen = new Date()
            const collection = 'sharedList'
            const objectId = 'list-a'

            const userReferences: UserReference[] = [
                { type: 'user-reference', id: 'user-A' },
                { type: 'user-reference', id: 'user-B' },
                { type: 'user-reference', id: 'user-C' },
            ]

            const follows: ActivityFollow[] = []

            for (const userReference of userReferences) {
                const follow = await activityFollows.storeFollow({
                    userReference,
                    createdWhen,
                    collection,
                    objectId,
                })

                follows.push(follow)
            }

            const followsOfEntity = await activityFollows.getAllFollowsByEntity(
                {
                    collection,
                    objectId,
                },
            )

            expect(followsOfEntity).toEqual(follows)
        },
    )
})
