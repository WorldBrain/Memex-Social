import flatten from 'lodash/flatten'
import expect from 'expect'
import {
    createStorageTestSuite,
    createMultiDeviceStorageTestSuite,
    StorageTestDevice,
    MultiDeviceStorageTestContext,
} from '../../../tests/storage-tests'
import * as data from './index.test.data'
import orderBy from 'lodash/orderBy'
import {
    SharedListReference,
    SharedListRoleID,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import { processListKey } from '@worldbrain/memex-common/lib/content-sharing/keys'
import { isAccessRulesPermissionError } from '@worldbrain/memex-common/lib/storage/utils'
import { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'

createStorageTestSuite('Content sharing storage', ({ it }) => {
    it(
        'should save lists and retrieve them',
        { withTestUser: true },
        async ({ storage, services }) => {
            const { contentSharing } = storage.serverModules
            const userReference = services.auth.getCurrentUserReference()!
            const listReference = await contentSharing.createSharedList({
                listData: {
                    title: 'My list',
                },
                userReference,
            })
            const retrieved = await contentSharing.retrieveList(listReference)
            expect(retrieved).toEqual({
                creator: userReference,
                sharedList: expect.objectContaining({
                    reference: listReference,
                    creator: userReference,
                    createdWhen: expect.any(Number),
                    updatedWhen: expect.any(Number),
                    title: 'My list',
                }),
                entries: [],
            })
        },
    )

    it(
        'should update list titles',
        { withTestUser: true },
        async ({ storage, services }) => {
            const { contentSharing } = storage.serverModules
            const userReference = services.auth.getCurrentUserReference()!
            const listReference = await contentSharing.createSharedList({
                listData: {
                    title: 'My list',
                },
                userReference,
            })
            await contentSharing.updateListTitle(
                listReference,
                'Updated list title',
            )
            const retrieved = await contentSharing.retrieveList(listReference)
            expect(retrieved).toEqual({
                creator: userReference,
                sharedList: expect.objectContaining({
                    reference: listReference,
                    creator: userReference,
                    createdWhen: expect.any(Number),
                    updatedWhen: expect.any(Number),
                    title: 'Updated list title',
                }),
                entries: [],
            })
        },
    )

    it(
        'should get lists by references',
        { withTestUser: true },
        async ({ storage, services }) => {
            const { contentSharing } = storage.serverModules
            const userReference = services.auth.getCurrentUserReference()!
            const listReferences: SharedListReference[] = []
            const titles: string[] = []
            for (let i = 0; i < 15; ++i) {
                const title = `My list ${i}`
                titles.push(title)
                listReferences.push(
                    await contentSharing.createSharedList({
                        listData: {
                            title,
                        },
                        userReference,
                    }),
                )
            }

            const retrieved = await contentSharing.getListsByReferences(
                listReferences,
            )
            expect(retrieved.map((list) => list.title).sort()).toEqual(
                titles.sort(),
            )
        },
    )

    it(
        'should save list entries and retrieve them',
        { withTestUser: true },
        async ({ storage, services }) => {
            const { contentSharing } = storage.serverModules
            const userReference = services.auth.getCurrentUserReference()!
            const listReference = await contentSharing.createSharedList({
                listData: {
                    title: 'My list',
                },
                userReference,
            })
            const test = async () => {
                await data.createTestListEntries({
                    contentSharing,
                    listReference,
                    userReference,
                })
                const retrieved = (await contentSharing.retrieveList(
                    listReference,
                ))!
                expect(retrieved).toEqual({
                    creator: userReference,
                    sharedList: expect.objectContaining({
                        reference: listReference,
                        creator: userReference,
                        createdWhen: expect.any(Number),
                        updatedWhen: expect.any(Number),
                        title: 'My list',
                    }),
                    entries: [
                        {
                            reference: {
                                type: 'shared-list-entry-reference',
                                id: expect.anything(),
                            },
                            creator: userReference,
                            sharedList: listReference,
                            createdWhen: expect.any(Number),
                            updatedWhen: expect.any(Number),
                            entryTitle: 'Page 1',
                            originalUrl: 'https://www.foo.com/page-1',
                            normalizedUrl: 'foo.com/page-1',
                        },
                        {
                            reference: {
                                type: 'shared-list-entry-reference',
                                id: expect.anything(),
                            },
                            creator: userReference,
                            sharedList: listReference,
                            createdWhen: 592,
                            updatedWhen: expect.any(Number),
                            entryTitle: 'Page 2',
                            originalUrl: 'https://www.bar.com/page-2',
                            normalizedUrl: 'bar.com/page-2',
                        },
                        {
                            reference: {
                                type: 'shared-list-entry-reference',
                                id: expect.anything(),
                            },
                            creator: userReference,
                            sharedList: listReference,
                            createdWhen: data.TEST_PDF_LIST_ENTRY.createdWhen,
                            updatedWhen: expect.any(Number),
                            entryTitle: data.TEST_PDF_LIST_ENTRY.entryTitle,
                            originalUrl: data.TEST_LOCATORS[0].originalUrl,
                            normalizedUrl:
                                data.TEST_PDF_LIST_ENTRY.normalizedUrl,
                        },
                    ],
                })
            }
            await test()

            // should not upload duplicate list entries
            await test()
        },
    )

    it(
        'should remove list entries',
        { withTestUser: true },
        async ({ storage, services }) => {
            const { contentSharing } = storage.serverModules
            const userReference = services.auth.getCurrentUserReference()!
            const listReference = await contentSharing.createSharedList({
                listData: {
                    title: 'My list',
                },
                userReference,
            })
            await data.createTestListEntries({
                contentSharing,
                listReference,
                userReference,
            })
            await contentSharing.removeListEntries({
                listReference,
                normalizedUrl: 'bar.com/page-2',
            })

            const retrieved = (await contentSharing.retrieveList(
                listReference,
            ))!
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
                    expect.objectContaining({
                        entryTitle: data.TEST_PDF_LIST_ENTRY.entryTitle,
                        normalizedUrl: data.TEST_PDF_LIST_ENTRY.normalizedUrl,
                    }),
                ],
            })
        },
    )

    it(
        'should store and retrieve page info',
        { withTestUser: true },
        async ({ storage, services }) => {
            const { contentSharing } = storage.serverModules
            const userReference = services.auth.getCurrentUserReference()!
            const pageInfo = {
                ...data.TEST_LIST_ENTRIES[0],
                fullTitle: data.TEST_LIST_ENTRIES[0].entryTitle,
            }
            delete (pageInfo as any).entryTitle
            const originalPageReference = await contentSharing.createPageInfo({
                pageInfo,
                creatorReference: userReference,
            })
            const linkId = contentSharing.getSharedPageInfoLinkID(
                originalPageReference,
            )
            expect(linkId).toEqual(expect.any(String))
            const pageReferenceFromId = contentSharing.getSharedPageInfoReferenceFromLinkID(
                linkId,
            )
            expect(pageReferenceFromId).toEqual(originalPageReference)
            expect(
                await contentSharing.getPageInfo(pageReferenceFromId),
            ).toEqual({
                reference: originalPageReference,
                pageInfo: {
                    ...pageInfo,
                    sourceUrl: pageInfo.originalUrl,
                    createdWhen: expect.any(Number),
                    updatedWhen: expect.any(Number),
                },
                creatorReference: userReference,
            })
        },
    )

    it(
        'should ensure page info objects',
        { withTestUser: true },
        async ({ storage, services }) => {
            const { contentSharing } = storage.serverModules
            const userReference = services.auth.getCurrentUserReference()!
            const pageInfo = {
                ...data.TEST_LIST_ENTRIES[0],
                fullTitle: data.TEST_LIST_ENTRIES[0].entryTitle,
            }
            delete (pageInfo as any).entryTitle
            const firstPageReference = await contentSharing.ensurePageInfo({
                pageInfo,
                creatorReference: userReference,
            })
            const secondPageReference = await contentSharing.ensurePageInfo({
                pageInfo,
                creatorReference: userReference,
            })
            expect(firstPageReference).toEqual(secondPageReference)
            expect(
                await storage.serverStorageManager
                    .collection('sharedPageInfo')
                    .findObjects({}),
            ).toEqual([
                expect.objectContaining({
                    normalizedUrl: data.TEST_LIST_ENTRIES[0].normalizedUrl,
                }),
            ])
        },
    )

    it(
        'should store and retrieve annotations',
        { withTestUser: true },
        async ({ storage, services }) => {
            const { contentSharing } = storage.serverModules
            const userReference = services.auth.getCurrentUserReference()!
            const listReference1 = await contentSharing.createSharedList({
                listData: {
                    title: 'My list',
                },
                userReference,
            })
            await data.createTestListEntries({
                contentSharing,
                listReference: listReference1,
                userReference,
            })
            await data.createTestAnnotations({
                contentSharing,
                listReference: listReference1,
                userReference,
            })
            const listReference2 = await contentSharing.createSharedList({
                listData: {
                    title: 'My list 2',
                },
                userReference,
            })
            await data.createTestListEntries({
                contentSharing,
                listReference: listReference2,
                userReference,
            })
            const creationResult = await data.createTestAnnotations({
                contentSharing,
                listReference: listReference2,
                userReference,
            })
            expect(creationResult).toEqual({
                sharedAnnotationReferences: {
                    [data.TEST_ANNOTATIONS_BY_PAGE['foo.com/page-1'][0]
                        .localId]: expect.objectContaining({
                        type: 'shared-annotation-reference',
                    }),
                    [data.TEST_ANNOTATIONS_BY_PAGE['foo.com/page-1'][1]
                        .localId]: expect.objectContaining({
                        type: 'shared-annotation-reference',
                    }),
                    [data.TEST_ANNOTATIONS_BY_PAGE['bar.com/page-2'][0]
                        .localId]: expect.objectContaining({
                        type: 'shared-annotation-reference',
                    }),
                    [data.TEST_ANNOTATIONS_BY_PAGE[
                        'memex.cloud/ct/test-fingerprint-1.pdf'
                    ][0].localId]: expect.objectContaining({
                        type: 'shared-annotation-reference',
                    }),
                },
                sharedAnnotationListEntryReferences: {
                    [data.TEST_ANNOTATIONS_BY_PAGE['foo.com/page-1'][0]
                        .localId]: [
                        expect.objectContaining({
                            type: 'shared-annotation-list-entry-reference',
                        }),
                    ],
                    [data.TEST_ANNOTATIONS_BY_PAGE['foo.com/page-1'][1]
                        .localId]: [
                        expect.objectContaining({
                            type: 'shared-annotation-list-entry-reference',
                        }),
                    ],
                    [data.TEST_ANNOTATIONS_BY_PAGE['bar.com/page-2'][0]
                        .localId]: [
                        expect.objectContaining({
                            type: 'shared-annotation-list-entry-reference',
                        }),
                    ],
                    [data.TEST_ANNOTATIONS_BY_PAGE[
                        'memex.cloud/ct/test-fingerprint-1.pdf'
                    ][0].localId]: [
                        expect.objectContaining({
                            type: 'shared-annotation-list-entry-reference',
                        }),
                    ],
                },
            })

            const getRemoteId = <
                PageUrl extends keyof typeof data.TEST_ANNOTATIONS_BY_PAGE
            >(
                normalizedPageUrl: PageUrl,
                annotationIndex: number,
            ) =>
                contentSharing._idFromReference(
                    creationResult.sharedAnnotationReferences[
                        data.TEST_ANNOTATIONS_BY_PAGE[normalizedPageUrl][
                            annotationIndex
                        ].localId
                    ] as any,
                )
            expect(
                await contentSharing.getAnnotationsForPagesInList({
                    listReference: listReference2,
                    normalizedPageUrls: [
                        'foo.com/page-1',
                        'bar.com/page-2',
                        data.TEST_PDF_LIST_ENTRY.normalizedUrl,
                    ],
                }),
            ).toEqual({
                'foo.com/page-1': [
                    {
                        annotation: {
                            id: getRemoteId('foo.com/page-1', 0),
                            createdWhen: 500,
                            uploadedWhen: expect.any(Number),
                            updatedWhen: expect.any(Number),
                            creator: userReference.id,
                            normalizedPageUrl: 'foo.com/page-1',
                            body: 'Body 1',
                            comment: 'Comment 1',
                            selector: 'Selector 1',
                        },
                    },
                    {
                        annotation: {
                            id: getRemoteId('foo.com/page-1', 1),
                            createdWhen: 1500,
                            uploadedWhen: expect.any(Number),
                            updatedWhen: expect.any(Number),
                            creator: userReference.id,
                            normalizedPageUrl: 'foo.com/page-1',
                            body: 'Body 2',
                            comment: 'Comment 2',
                            selector: 'Selector 2',
                        },
                    },
                ],
                'bar.com/page-2': [
                    {
                        annotation: {
                            id: getRemoteId('bar.com/page-2', 0),
                            createdWhen: 2000,
                            uploadedWhen: expect.any(Number),
                            updatedWhen: expect.any(Number),
                            creator: userReference.id,
                            normalizedPageUrl: 'bar.com/page-2',
                            body: 'Body 3',
                            comment: 'Comment 3',
                            selector: 'Selector 3',
                        },
                    },
                ],
                [data.TEST_PDF_LIST_ENTRY.normalizedUrl]: [
                    {
                        annotation: {
                            id: getRemoteId(
                                'memex.cloud/ct/test-fingerprint-1.pdf',
                                0,
                            ),
                            createdWhen: 2500,
                            uploadedWhen: expect.any(Number),
                            updatedWhen: expect.any(Number),
                            creator: userReference.id,
                            normalizedPageUrl:
                                data.TEST_PDF_LIST_ENTRY.normalizedUrl,
                            body: 'Body 4',
                            comment: 'Comment 4',
                            selector: 'Selector 4',
                        },
                    },
                ],
            })
        },
    )

    it(
        'should retrieve a random user list entry for a normalized page URL',
        { withTestUser: true },
        async ({ storage, services }) => {
            const { contentSharing } = storage.serverModules
            const userReference = services.auth.getCurrentUserReference()!
            const listReference1 = await contentSharing.createSharedList({
                listData: {
                    title: 'My list',
                },
                userReference,
            })
            await data.createTestListEntries({
                contentSharing,
                listReference: listReference1,
                userReference,
            })
            const retrievedEntry = await contentSharing.getRandomUserListEntryForUrl(
                {
                    creatorReference: userReference,
                    normalizedUrl: 'bar.com/page-2',
                },
            )
            expect(retrievedEntry).toEqual({
                entry: {
                    entryTitle: 'Page 2',
                    originalUrl: 'https://www.bar.com/page-2',
                    normalizedUrl: 'bar.com/page-2',
                    createdWhen: 592,
                    updatedWhen: expect.any(Number),
                },
            })
        },
    )

    it(
        'should retrieve single annotations',
        { withTestUser: true },
        async ({ storage, services }) => {
            const { contentSharing } = storage.serverModules
            const userReference = services.auth.getCurrentUserReference()!
            const listReference1 = await contentSharing.createSharedList({
                listData: {
                    title: 'My list',
                },
                userReference,
            })
            await data.createTestListEntries({
                contentSharing,
                listReference: listReference1,
                userReference,
            })
            const creationResult = await data.createTestAnnotations({
                contentSharing,
                listReference: listReference1,
                userReference,
            })
            const annotationReference =
                creationResult.sharedAnnotationReferences[
                    data.TEST_ANNOTATIONS_BY_PAGE['bar.com/page-2'][0].localId
                ]
            const retrievedAnnotation = await contentSharing.getAnnotation({
                reference: annotationReference,
            })
            expect(retrievedAnnotation).toEqual({
                annotation: {
                    ...data.TEST_ANNOTATIONS_BY_PAGE['bar.com/page-2'][0],
                    normalizedPageUrl: 'bar.com/page-2',
                    uploadedWhen: expect.any(Number),
                    updatedWhen: expect.any(Number),
                    localId: undefined,
                },
                creatorReference: userReference,
            })
        },
    )

    it(
        'should retrieve all annotations by creator and URL',
        { withTestUser: true },
        async ({ storage, services }) => {
            const { contentSharing } = storage.serverModules
            const userReference = services.auth.getCurrentUserReference()!
            const listReference = await contentSharing.createSharedList({
                listData: {
                    title: 'My list',
                },
                userReference,
            })
            await data.createTestListEntries({
                contentSharing,
                listReference: listReference,
                userReference,
            })
            await data.createTestAnnotations({
                contentSharing,
                listReference: listReference,
                userReference,
            })
            const retrievedAnnotations = orderBy(
                await contentSharing.getAnnotationsByCreatorAndPageUrl({
                    creatorReference: userReference,
                    normalizedPageUrl: 'foo.com/page-1',
                }),
                ['createdWhen', 'asc'],
            )
            expect(retrievedAnnotations).toEqual([
                {
                    linkId: contentSharing.getSharedAnnotationLinkID(
                        retrievedAnnotations[0].reference,
                    ),
                    reference: expect.objectContaining({
                        type: 'shared-annotation-reference',
                    }),
                    creator: userReference,
                    normalizedPageUrl: 'foo.com/page-1',
                    createdWhen: 500,
                    uploadedWhen: expect.any(Number),
                    updatedWhen: expect.any(Number),
                    body: 'Body 1',
                    comment: 'Comment 1',
                    selector: 'Selector 1',
                },
                {
                    linkId: contentSharing.getSharedAnnotationLinkID(
                        retrievedAnnotations[1].reference,
                    ),
                    reference: expect.objectContaining({
                        type: 'shared-annotation-reference',
                    }),
                    creator: userReference,
                    createdWhen: 1500,
                    uploadedWhen: expect.any(Number),
                    updatedWhen: expect.any(Number),
                    normalizedPageUrl: 'foo.com/page-1',
                    body: 'Body 2',
                    comment: 'Comment 2',
                    selector: 'Selector 2',
                },
            ])
        },
    )

    it(
        'should retrieve all annotations by creator and URL that are in a given list',
        { withTestUser: true },
        async ({ storage, services }) => {
            const { contentSharing } = storage.serverModules
            const userReference = services.auth.getCurrentUserReference()!
            const listReferenceA = await contentSharing.createSharedList({
                listData: {
                    title: 'list A',
                },
                userReference,
            })
            const listReferenceB = await contentSharing.createSharedList({
                listData: {
                    title: 'list B',
                },
                userReference,
            })
            await data.createTestListEntries({
                contentSharing,
                listReference: listReferenceA,
                userReference,
            })
            await data.createTestListEntries({
                contentSharing,
                listReference: listReferenceB,
                userReference,
            })
            await storage.serverModules.contentSharing.createAnnotations({
                listReferences: [listReferenceA],
                creator: userReference,
                annotationsByPage: {
                    'foo.com/page-1': [
                        {
                            createdWhen: 500,
                            localId: 'foo.com/page-1#500',
                            body: 'Body 1',
                            comment: 'Comment 1',
                            selector: 'Selector 1',
                        },
                        {
                            createdWhen: 1500,
                            localId: 'foo.com/page-1#1500',
                            body: 'Body 2',
                            comment: 'Comment 2',
                            selector: 'Selector 2',
                        },
                    ],
                },
            })
            await storage.serverModules.contentSharing.createAnnotations({
                listReferences: [listReferenceB],
                creator: userReference,
                annotationsByPage: {
                    'foo.com/page-1': [
                        {
                            createdWhen: 2000,
                            localId: 'foo.com/page-1#2000',
                            body: 'Body 3',
                            comment: 'Comment 3',
                            selector: 'Selector 3',
                        },
                    ],
                },
            })

            const retrievedAnnotationsListA = orderBy(
                await contentSharing.getListAnnotationsByCreatorAndPageUrl({
                    creatorReference: userReference,
                    normalizedPageUrl: 'foo.com/page-1',
                    sharedListReference: listReferenceA,
                }),
                ['createdWhen', 'asc'],
            )

            expect(retrievedAnnotationsListA).toEqual([
                {
                    linkId: contentSharing.getSharedAnnotationLinkID(
                        retrievedAnnotationsListA[0].reference,
                    ),
                    reference: expect.objectContaining({
                        type: 'shared-annotation-reference',
                    }),
                    creator: userReference,
                    normalizedPageUrl: 'foo.com/page-1',
                    createdWhen: 500,
                    uploadedWhen: expect.any(Number),
                    updatedWhen: expect.any(Number),
                    body: 'Body 1',
                    comment: 'Comment 1',
                    selector: 'Selector 1',
                },
                {
                    linkId: contentSharing.getSharedAnnotationLinkID(
                        retrievedAnnotationsListA[1].reference,
                    ),
                    reference: expect.objectContaining({
                        type: 'shared-annotation-reference',
                    }),
                    creator: userReference,
                    createdWhen: 1500,
                    uploadedWhen: expect.any(Number),
                    updatedWhen: expect.any(Number),
                    normalizedPageUrl: 'foo.com/page-1',
                    body: 'Body 2',
                    comment: 'Comment 2',
                    selector: 'Selector 2',
                },
            ])

            const retrievedAnnotationsListB = orderBy(
                await contentSharing.getListAnnotationsByCreatorAndPageUrl({
                    creatorReference: userReference,
                    normalizedPageUrl: 'foo.com/page-1',
                    sharedListReference: listReferenceB,
                }),
                ['createdWhen', 'asc'],
            )

            expect(retrievedAnnotationsListB).toEqual([
                {
                    linkId: contentSharing.getSharedAnnotationLinkID(
                        retrievedAnnotationsListB[0].reference,
                    ),
                    reference: expect.objectContaining({
                        type: 'shared-annotation-reference',
                    }),
                    creator: userReference,
                    normalizedPageUrl: 'foo.com/page-1',
                    createdWhen: 2000,
                    uploadedWhen: expect.any(Number),
                    updatedWhen: expect.any(Number),
                    body: 'Body 3',
                    comment: 'Comment 3',
                    selector: 'Selector 3',
                },
            ])
        },
    )

    it(
        'should retrieve all annotation entries for a list and get those annotations',
        { withTestUser: true },
        async ({ storage, services }) => {
            const { contentSharing } = storage.serverModules
            const userReference = services.auth.getCurrentUserReference()!
            const listReference1 = await contentSharing.createSharedList({
                listData: {
                    title: 'My list',
                },
                userReference,
            })
            await data.createTestListEntries({
                contentSharing,
                listReference: listReference1,
                userReference,
            })
            await data.createTestAnnotations({
                contentSharing,
                listReference: listReference1,
                userReference,
            })
            const listReference2 = await contentSharing.createSharedList({
                listData: {
                    title: 'My list 2',
                },
                userReference,
            })
            await data.createTestListEntries({
                contentSharing,
                listReference: listReference2,
                userReference,
            })
            await data.createTestAnnotations({
                contentSharing,
                listReference: listReference2,
                userReference,
            })

            const entries = await contentSharing.getAnnotationListEntries({
                listReference: listReference1,
            })
            expect(entries).toEqual({
                'bar.com/page-2': [
                    {
                        reference: expect.objectContaining({
                            type: 'shared-annotation-list-entry-reference',
                        }),
                        creator: userReference,
                        sharedList: listReference1,
                        sharedAnnotation: expect.objectContaining({
                            type: 'shared-annotation-reference',
                        }),
                        normalizedPageUrl: 'bar.com/page-2',
                        createdWhen: 2000,
                        uploadedWhen: expect.any(Number),
                        updatedWhen: expect.any(Number),
                    },
                ],
                'foo.com/page-1': [
                    {
                        reference: expect.objectContaining({
                            type: 'shared-annotation-list-entry-reference',
                        }),
                        creator: userReference,
                        sharedList: listReference1,
                        sharedAnnotation: expect.objectContaining({
                            type: 'shared-annotation-reference',
                        }),
                        normalizedPageUrl: 'foo.com/page-1',
                        createdWhen: 500,
                        uploadedWhen: expect.any(Number),
                        updatedWhen: expect.any(Number),
                    },
                    {
                        reference: expect.objectContaining({
                            type: 'shared-annotation-list-entry-reference',
                        }),
                        creator: userReference,
                        sharedList: listReference1,
                        sharedAnnotation: expect.objectContaining({
                            type: 'shared-annotation-reference',
                        }),
                        normalizedPageUrl: 'foo.com/page-1',
                        createdWhen: 1500,
                        uploadedWhen: expect.any(Number),
                        updatedWhen: expect.any(Number),
                    },
                ],
                [data.TEST_PDF_LIST_ENTRY.normalizedUrl]: [
                    {
                        reference: expect.objectContaining({
                            type: 'shared-annotation-list-entry-reference',
                        }),
                        creator: userReference,
                        sharedList: listReference1,
                        sharedAnnotation: expect.objectContaining({
                            type: 'shared-annotation-reference',
                        }),
                        normalizedPageUrl:
                            data.TEST_PDF_LIST_ENTRY.normalizedUrl,
                        createdWhen: 2500,
                        uploadedWhen: expect.any(Number),
                        updatedWhen: expect.any(Number),
                    },
                ],
            })

            expect(
                await contentSharing.getAnnotations({
                    references: flatten(
                        Object.values(entries).map((entries) =>
                            entries.map((entry) => entry.sharedAnnotation),
                        ),
                    ),
                }),
            ).toEqual({
                [contentSharing.getSharedAnnotationLinkID(
                    entries['foo.com/page-1'][0].sharedAnnotation,
                )]: {
                    linkId: expect.any(String),
                    reference: expect.objectContaining({
                        type: 'shared-annotation-reference',
                    }),
                    creator: userReference,
                    normalizedPageUrl: 'foo.com/page-1',
                    createdWhen: 500,
                    uploadedWhen: expect.any(Number),
                    updatedWhen: expect.any(Number),
                    body: 'Body 1',
                    comment: 'Comment 1',
                    selector: 'Selector 1',
                },
                [contentSharing.getSharedAnnotationLinkID(
                    entries['foo.com/page-1'][1].sharedAnnotation,
                )]: {
                    linkId: expect.any(String),
                    reference: expect.objectContaining({
                        type: 'shared-annotation-reference',
                    }),
                    creator: userReference,
                    createdWhen: 1500,
                    uploadedWhen: expect.any(Number),
                    updatedWhen: expect.any(Number),
                    normalizedPageUrl: 'foo.com/page-1',
                    body: 'Body 2',
                    comment: 'Comment 2',
                    selector: 'Selector 2',
                },
                [contentSharing.getSharedAnnotationLinkID(
                    entries['bar.com/page-2'][0].sharedAnnotation,
                )]: {
                    linkId: expect.any(String),
                    reference: expect.objectContaining({
                        type: 'shared-annotation-reference',
                    }),
                    creator: userReference,
                    normalizedPageUrl: 'bar.com/page-2',
                    createdWhen: 2000,
                    uploadedWhen: expect.any(Number),
                    updatedWhen: expect.any(Number),
                    body: 'Body 3',
                    comment: 'Comment 3',
                    selector: 'Selector 3',
                },
                [contentSharing.getSharedAnnotationLinkID(
                    entries[data.TEST_PDF_LIST_ENTRY.normalizedUrl][0]
                        .sharedAnnotation,
                )]: {
                    linkId: expect.any(String),
                    reference: expect.objectContaining({
                        type: 'shared-annotation-reference',
                    }),
                    creator: userReference,
                    normalizedPageUrl: data.TEST_PDF_LIST_ENTRY.normalizedUrl,
                    createdWhen: 2500,
                    uploadedWhen: expect.any(Number),
                    updatedWhen: expect.any(Number),
                    body: 'Body 4',
                    comment: 'Comment 4',
                    selector: 'Selector 4',
                },
            })
        },
    )

    it(
        'should retrieve all annotation entries for multiple lists',
        { withTestUser: true },
        async ({ storage, services }) => {
            const { contentSharing } = storage.serverModules
            const userReference = services.auth.getCurrentUserReference()!
            const listReference1 = await contentSharing.createSharedList({
                listData: {
                    title: 'My list',
                },
                userReference,
            })
            await data.createTestListEntries({
                contentSharing,
                listReference: listReference1,
                userReference,
            })
            await data.createTestAnnotations({
                contentSharing,
                listReference: listReference1,
                userReference,
            })
            const listReference2 = await contentSharing.createSharedList({
                listData: {
                    title: 'My list 2',
                },
                userReference,
            })
            await data.createTestListEntries({
                contentSharing,
                listReference: listReference2,
                userReference,
            })
            await data.createTestAnnotations({
                contentSharing,
                listReference: listReference2,
                userReference,
            })

            const entries = await contentSharing.getAnnotationListEntriesForLists(
                {
                    listReferences: [listReference1, listReference2],
                },
            )
            expect(entries[listReference1.id]).toEqual({
                'bar.com/page-2': [
                    {
                        reference: expect.objectContaining({
                            type: 'shared-annotation-list-entry-reference',
                        }),
                        creator: userReference,
                        sharedList: listReference1,
                        sharedAnnotation: expect.objectContaining({
                            type: 'shared-annotation-reference',
                        }),
                        normalizedPageUrl: 'bar.com/page-2',
                        createdWhen: 2000,
                        uploadedWhen: expect.any(Number),
                        updatedWhen: expect.any(Number),
                    },
                ],
                'foo.com/page-1': [
                    {
                        reference: expect.objectContaining({
                            type: 'shared-annotation-list-entry-reference',
                        }),
                        creator: userReference,
                        sharedList: listReference1,
                        sharedAnnotation: expect.objectContaining({
                            type: 'shared-annotation-reference',
                        }),
                        normalizedPageUrl: 'foo.com/page-1',
                        createdWhen: 500,
                        uploadedWhen: expect.any(Number),
                        updatedWhen: expect.any(Number),
                    },
                    {
                        reference: expect.objectContaining({
                            type: 'shared-annotation-list-entry-reference',
                        }),
                        creator: userReference,
                        sharedList: listReference1,
                        sharedAnnotation: expect.objectContaining({
                            type: 'shared-annotation-reference',
                        }),
                        normalizedPageUrl: 'foo.com/page-1',
                        createdWhen: 1500,
                        uploadedWhen: expect.any(Number),
                        updatedWhen: expect.any(Number),
                    },
                ],
                [data.TEST_PDF_LIST_ENTRY.normalizedUrl]: [
                    {
                        reference: expect.objectContaining({
                            type: 'shared-annotation-list-entry-reference',
                        }),
                        creator: userReference,
                        sharedList: listReference1,
                        sharedAnnotation: expect.objectContaining({
                            type: 'shared-annotation-reference',
                        }),
                        normalizedPageUrl:
                            data.TEST_PDF_LIST_ENTRY.normalizedUrl,
                        createdWhen: 2500,
                        uploadedWhen: expect.any(Number),
                        updatedWhen: expect.any(Number),
                    },
                ],
            })
            expect(entries[listReference2.id]).toEqual({
                'bar.com/page-2': [
                    {
                        reference: expect.objectContaining({
                            type: 'shared-annotation-list-entry-reference',
                        }),
                        creator: userReference,
                        sharedList: listReference2,
                        sharedAnnotation: expect.objectContaining({
                            type: 'shared-annotation-reference',
                        }),
                        normalizedPageUrl: 'bar.com/page-2',
                        createdWhen: 2000,
                        uploadedWhen: expect.any(Number),
                        updatedWhen: expect.any(Number),
                    },
                ],
                'foo.com/page-1': [
                    {
                        reference: expect.objectContaining({
                            type: 'shared-annotation-list-entry-reference',
                        }),
                        creator: userReference,
                        sharedList: listReference2,
                        sharedAnnotation: expect.objectContaining({
                            type: 'shared-annotation-reference',
                        }),
                        normalizedPageUrl: 'foo.com/page-1',
                        createdWhen: 500,
                        uploadedWhen: expect.any(Number),
                        updatedWhen: expect.any(Number),
                    },
                    {
                        reference: expect.objectContaining({
                            type: 'shared-annotation-list-entry-reference',
                        }),
                        creator: userReference,
                        sharedList: listReference2,
                        sharedAnnotation: expect.objectContaining({
                            type: 'shared-annotation-reference',
                        }),
                        normalizedPageUrl: 'foo.com/page-1',
                        createdWhen: 1500,
                        uploadedWhen: expect.any(Number),
                        updatedWhen: expect.any(Number),
                    },
                ],
                [data.TEST_PDF_LIST_ENTRY.normalizedUrl]: [
                    {
                        reference: expect.objectContaining({
                            type: 'shared-annotation-list-entry-reference',
                        }),
                        creator: userReference,
                        sharedList: listReference2,
                        sharedAnnotation: expect.objectContaining({
                            type: 'shared-annotation-reference',
                        }),
                        normalizedPageUrl:
                            data.TEST_PDF_LIST_ENTRY.normalizedUrl,
                        createdWhen: 2500,
                        uploadedWhen: expect.any(Number),
                        updatedWhen: expect.any(Number),
                    },
                ],
            })
        },
    )

    it(
        'should add an existing annotation to a new list',
        { withTestUser: true },
        async ({ storage, services }) => {
            const { contentSharing } = storage.serverModules
            const userReference = services.auth.getCurrentUserReference()!
            const listReference1 = await contentSharing.createSharedList({
                listData: {
                    title: 'My list',
                },
                userReference,
            })
            await data.createTestListEntries({
                contentSharing,
                listReference: listReference1,
                userReference,
            })
            const {
                sharedAnnotationReferences,
            } = await data.createTestAnnotations({
                contentSharing,
                listReference: listReference1,
                userReference,
            })
            const listReference2 = await contentSharing.createSharedList({
                listData: {
                    title: 'My list 2',
                },
                userReference,
            })
            await data.createTestListEntries({
                contentSharing,
                listReference: listReference2,
                userReference,
            })

            const test = async () => {
                await contentSharing.addAnnotationsToLists({
                    creator: userReference,
                    sharedListReferences: [listReference2],
                    sharedAnnotations: Object.entries(
                        sharedAnnotationReferences,
                    ).map(([localId, reference]) => ({
                        reference,
                        normalizedPageUrl:
                            data.TEST_ANNOTATION_PAGE_URLS_BY_LOCAL_ID[localId]
                                .normalizedPageUrl,
                        createdWhen:
                            data.TEST_ANNOTATION_PAGE_URLS_BY_LOCAL_ID[localId]
                                .createdWhen,
                    })),
                })

                const annotationEntries = await storage.serverStorageManager.operation(
                    'findObjects',
                    'sharedAnnotationListEntry',
                    {},
                )
                expect(annotationEntries).toEqual([
                    expect.objectContaining({}),
                    expect.objectContaining({}),
                    expect.objectContaining({}),
                    expect.objectContaining({}),
                    expect.objectContaining({}),
                    expect.objectContaining({}),
                    expect.objectContaining({}),
                    expect.objectContaining({}),
                ])

                expect(
                    await contentSharing.getAnnotationsForPagesInList({
                        listReference: listReference2,
                        normalizedPageUrls: [
                            'foo.com/page-1',
                            'bar.com/page-2',
                        ],
                    }),
                ).toEqual({
                    'foo.com/page-1': [
                        {
                            annotation: {
                                id: expect.anything(),
                                createdWhen: 500,
                                uploadedWhen: expect.any(Number),
                                updatedWhen: expect.any(Number),
                                creator: userReference.id,
                                normalizedPageUrl: 'foo.com/page-1',
                                body: 'Body 1',
                                comment: 'Comment 1',
                                selector: 'Selector 1',
                            },
                        },
                        {
                            annotation: {
                                id: expect.anything(),
                                createdWhen: 1500,
                                uploadedWhen: expect.any(Number),
                                updatedWhen: expect.any(Number),
                                creator: userReference.id,
                                normalizedPageUrl: 'foo.com/page-1',
                                body: 'Body 2',
                                comment: 'Comment 2',
                                selector: 'Selector 2',
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
                                normalizedPageUrl: 'bar.com/page-2',
                                body: 'Body 3',
                                comment: 'Comment 3',
                                selector: 'Selector 3',
                            },
                        },
                    ],
                })
            }
            await test()

            // should not create duplicate entries
            await test()
        },
    )

    it(
        'should remove an existing annotation from a list',
        { withTestUser: true },
        async ({ storage, services }) => {
            const { contentSharing } = storage.serverModules
            const userReference = services.auth.getCurrentUserReference()!
            const listReference1 = await contentSharing.createSharedList({
                listData: {
                    title: 'My list',
                },
                userReference,
            })
            await data.createTestListEntries({
                contentSharing,
                listReference: listReference1,
                userReference,
            })
            const creationResult = await data.createTestAnnotations({
                contentSharing,
                listReference: listReference1,
                userReference,
            })
            await contentSharing.removeAnnotationsFromLists({
                sharedListReferences: [listReference1],
                sharedAnnotationReferences: [
                    creationResult.sharedAnnotationReferences[
                        data.TEST_ANNOTATIONS_BY_PAGE['bar.com/page-2'][0]
                            .localId
                    ],
                    creationResult.sharedAnnotationReferences[
                        data.TEST_ANNOTATIONS_BY_PAGE['foo.com/page-1'][1]
                            .localId
                    ],
                ],
            })

            expect(
                await contentSharing.getAnnotationsForPagesInList({
                    listReference: listReference1,
                    normalizedPageUrls: ['foo.com/page-1', 'bar.com/page-2'],
                }),
            ).toEqual({
                'foo.com/page-1': [
                    {
                        annotation: {
                            id: expect.anything(),
                            createdWhen: 500,
                            uploadedWhen: expect.any(Number),
                            updatedWhen: expect.any(Number),
                            creator: userReference.id,
                            normalizedPageUrl: 'foo.com/page-1',
                            body: 'Body 1',
                            comment: 'Comment 1',
                            selector: 'Selector 1',
                        },
                    },
                ],
            })
        },
    )

    it(
        'should remove an annotation and all its list entries',
        { withTestUser: true },
        async ({ storage, services }) => {
            const { contentSharing } = storage.serverModules
            const userReference = services.auth.getCurrentUserReference()!
            const listReference1 = await contentSharing.createSharedList({
                listData: {
                    title: 'My list',
                },
                userReference,
            })
            await data.createTestListEntries({
                contentSharing,
                listReference: listReference1,
                userReference,
            })
            const creationResult = await data.createTestAnnotations({
                contentSharing,
                listReference: listReference1,
                userReference,
            })
            await contentSharing.removeAnnotations({
                sharedAnnotationReferences: [
                    creationResult.sharedAnnotationReferences[
                        data.TEST_ANNOTATIONS_BY_PAGE['bar.com/page-2'][0]
                            .localId
                    ],
                    creationResult.sharedAnnotationReferences[
                        data.TEST_ANNOTATIONS_BY_PAGE['foo.com/page-1'][1]
                            .localId
                    ],
                ],
            })

            expect(
                await contentSharing.getAnnotationsForPagesInList({
                    listReference: listReference1,
                    normalizedPageUrls: ['foo.com/page-1', 'bar.com/page-2'],
                }),
            ).toEqual({
                'foo.com/page-1': [
                    {
                        annotation: {
                            id: expect.anything(),
                            createdWhen: 500,
                            uploadedWhen: expect.any(Number),
                            updatedWhen: expect.any(Number),
                            creator: userReference.id,
                            normalizedPageUrl: 'foo.com/page-1',
                            body: 'Body 1',
                            comment: 'Comment 1',
                            selector: 'Selector 1',
                        },
                    },
                ],
            })
            expect(
                await storage.serverStorageManager.operation(
                    'findObjects',
                    'sharedAnnotation',
                    {},
                ),
            ).toEqual([
                expect.objectContaining({
                    normalizedPageUrl: 'foo.com/page-1',
                }),
                expect.objectContaining({
                    normalizedPageUrl: data.TEST_PDF_LIST_ENTRY.normalizedUrl,
                }),
            ])
        },
    )

    it(
        'should update the comment of a shared annotation',
        { withTestUser: true },
        async ({ storage, services }) => {
            const { contentSharing } = storage.serverModules
            const userReference = services.auth.getCurrentUserReference()!
            const listReference1 = await contentSharing.createSharedList({
                listData: {
                    title: 'My list',
                },
                userReference,
            })
            await data.createTestListEntries({
                contentSharing,
                listReference: listReference1,
                userReference,
            })
            const creationResult = await data.createTestAnnotations({
                contentSharing,
                listReference: listReference1,
                userReference,
            })
            const sharedAnnotationReference =
                creationResult.sharedAnnotationReferences[
                    data.TEST_ANNOTATIONS_BY_PAGE['foo.com/page-1'][1].localId
                ]
            await contentSharing.updateAnnotationComment({
                sharedAnnotationReference,
                updatedComment: 'Updated comment',
            })
            expect(
                await contentSharing.getAnnotationsForPagesInList({
                    listReference: listReference1,
                    normalizedPageUrls: ['foo.com/page-1', 'bar.com/page-2'],
                }),
            ).toEqual({
                'foo.com/page-1': [
                    {
                        annotation: expect.objectContaining({
                            body: 'Body 1',
                            comment: 'Comment 1',
                            selector: 'Selector 1',
                        }),
                    },
                    {
                        annotation: expect.objectContaining({
                            body: 'Body 2',
                            comment: 'Updated comment',
                            selector: 'Selector 2',
                        }),
                    },
                ],
                'bar.com/page-2': [
                    {
                        annotation: expect.objectContaining({
                            body: 'Body 3',
                            comment: 'Comment 3',
                            selector: 'Selector 3',
                        }),
                    },
                ],
            })
        },
    )

    it(`should support deletion of created list keys`, async ({
        services,
        storage,
    }) => {
        const { contentSharing } = storage.serverModules
        const listReference = await contentSharing.createSharedList({
            listData: { title: 'My list' },
            userReference: { type: 'user-reference', id: 1 },
        })

        const {
            keyString: adderKeyString,
        } = await storage.serverModules.contentSharing.createListKey({
            listReference,
            key: {
                roleID: SharedListRoleID.AddOnly,
            },
        })

        const {
            keyString: readerKeyString,
        } = await storage.serverModules.contentSharing.createListKey({
            listReference,
            key: {
                roleID: SharedListRoleID.Commenter,
            },
        })

        expect(
            await storage.serverModules.contentSharing.getListKeys({
                listReference,
            }),
        ).toEqual([
            {
                reference: {
                    id: adderKeyString,
                    type: 'shared-list-key-reference',
                },
                sharedList: {
                    id: listReference.id,
                    type: 'shared-list-reference',
                },
                createdWhen: expect.any(Number),
                updatedWhen: expect.any(Number),
                roleID: SharedListRoleID.AddOnly,
                disabled: false,
            },
            {
                reference: {
                    id: readerKeyString,
                    type: 'shared-list-key-reference',
                },
                sharedList: {
                    id: listReference.id,
                    type: 'shared-list-reference',
                },
                createdWhen: expect.any(Number),
                updatedWhen: expect.any(Number),
                roleID: SharedListRoleID.Commenter,
                disabled: false,
            },
        ])

        await storage.serverModules.contentSharing.deleteListKey({
            keyString: adderKeyString,
            listReference,
        })

        expect(
            await storage.serverModules.contentSharing.getListKeys({
                listReference,
            }),
        ).toEqual([
            {
                reference: {
                    id: readerKeyString,
                    type: 'shared-list-key-reference',
                },
                sharedList: {
                    id: listReference.id,
                    type: 'shared-list-reference',
                },
                createdWhen: expect.any(Number),
                updatedWhen: expect.any(Number),
                roleID: SharedListRoleID.Commenter,
                disabled: false,
            },
        ])

        await storage.serverModules.contentSharing.deleteListKey({
            keyString: readerKeyString,
            listReference,
        })

        expect(
            await storage.serverModules.contentSharing.getListKeys({
                listReference,
            }),
        ).toEqual([])
    })

    it('should be able to get all shared list roles for a user', async ({
        services,
        storage,
    }) => {
        const { contentSharing } = storage.serverModules
        const listCreatorReference: UserReference = {
            type: 'user-reference',
            id: 1,
        }
        const userReference: UserReference = { type: 'user-reference', id: 2 }

        const listReference1 = await contentSharing.createSharedList({
            listData: { title: 'My list' },
            userReference: listCreatorReference,
        })

        const listReference2 = await contentSharing.createSharedList({
            listData: { title: 'My list 2' },
            userReference: listCreatorReference,
        })

        expect(
            await contentSharing.getUserListRoles({ userReference }),
        ).toEqual([])

        await contentSharing.createListRole({
            roleID: SharedListRoleID.ReadWrite,
            listReference: listReference1,
            userReference,
        })

        expect(
            await contentSharing.getUserListRoles({ userReference }),
        ).toEqual([
            expect.objectContaining({
                roleID: SharedListRoleID.ReadWrite,
                sharedList: listReference1,
                user: userReference,
            }),
        ])

        await contentSharing.createListRole({
            roleID: SharedListRoleID.ReadWrite,
            listReference: listReference2,
            userReference,
        })

        expect(
            await contentSharing.getUserListRoles({ userReference }),
        ).toEqual([
            expect.objectContaining({
                roleID: SharedListRoleID.ReadWrite,
                sharedList: listReference1,
                user: userReference,
            }),
            expect.objectContaining({
                roleID: SharedListRoleID.ReadWrite,
                sharedList: listReference2,
                user: userReference,
            }),
        ])
    })
})

createMultiDeviceStorageTestSuite(
    'Content sharing storage (multi-device)',
    ({ it }) => {
        async function setupTest(
            context: MultiDeviceStorageTestContext,
            options?: {
                withTestListEntries?: boolean
            },
        ) {
            if (!context.enforcesAccessRules) {
                context.skipTest()
            }

            const userIds = ['user-a', 'user-b']
            const devices = await Promise.all(
                userIds.map((uid) =>
                    context.createDevice({ withTestUser: { uid } }),
                ),
            )
            const { contentSharing } = devices[0].storage.serverModules
            const userReference = devices[0].services.auth.getCurrentUserReference()!
            const listReference = await contentSharing.createSharedList({
                listData: {
                    title: 'My list',
                },
                userReference,
            })
            if (options?.withTestListEntries) {
                await data.createTestListEntries({
                    listReference: listReference,
                    contentSharing:
                        devices[0].storage.serverModules.contentSharing,
                    userReference: devices[0].services.auth.getCurrentUserReference()!,
                })
            }

            return {
                devices,
                devicesByRole: { listOwner: devices[0] },
                contentSharing,
                listReference,
            }
        }

        it(`should by default not allow users to add to each others' lists`, async (context) => {
            const { devices, devicesByRole, listReference } = await setupTest(
                context,
            )

            await expectPermissions({
                allowedDevices: [devicesByRole.listOwner],
                deniedDevices: [devices[1]],
                operation: (device) =>
                    data.createTestListEntries({
                        listReference: listReference,
                        contentSharing:
                            device.storage.serverModules.contentSharing,
                        userReference: device.services.auth.getCurrentUserReference()!,
                    }),
            })
            await expectPermissions({
                allowedDevices: [devicesByRole.listOwner],
                deniedDevices: [devices[1]],
                operation: async (device) => {
                    await data.createTestAnnotations({
                        contentSharing:
                            device.storage.serverModules.contentSharing,
                        listReference: listReference,
                        userReference: device.services.auth.getCurrentUserReference()!,
                    })
                },
            })
        })

        it(`should by default not allow users to update each others' list entries`, async (context) => {
            const {
                devices,
                devicesByRole,
                listReference,
            } = await setupTest(context, { withTestListEntries: true })
            const creationResult = await data.createTestAnnotations({
                contentSharing: devices[0].storage.serverModules.contentSharing,
                listReference: listReference,
                userReference: devices[0].services.auth.getCurrentUserReference()!,
            })
            const sharedAnnotationReference =
                creationResult.sharedAnnotationReferences[
                    data.TEST_ANNOTATIONS_BY_PAGE['foo.com/page-1'][1].localId
                ]
            await expectPermissions({
                allowedDevices: [devicesByRole.listOwner],
                deniedDevices: [devices[1]],
                operation: (device) =>
                    device.storage.serverModules.contentSharing.updateAnnotationComment(
                        {
                            sharedAnnotationReference,
                            updatedComment: 'Updated comment',
                        },
                    ),
            })
        })

        it(`should by default not allow users to remove entries that are not their own from each others' lists`, async (context) => {
            const {
                devices,
                devicesByRole,
                listReference,
            } = await setupTest(context, { withTestListEntries: true })
            const creationResult = await data.createTestAnnotations({
                contentSharing: devices[0].storage.serverModules.contentSharing,
                listReference: listReference,
                userReference: devices[0].services.auth.getCurrentUserReference()!,
            })
            const sharedAnnotationReference =
                creationResult.sharedAnnotationReferences[
                    data.TEST_ANNOTATIONS_BY_PAGE['foo.com/page-1'][1].localId
                ]
            await expectPermissions({
                allowedDevices: [devicesByRole.listOwner],
                deniedDevices: [devices[1]],
                operation: (device) =>
                    device.storage.serverModules.contentSharing.removeListEntries(
                        {
                            listReference,
                            normalizedUrl: 'bar.com/page-2',
                        },
                    ),
            })
            await expectPermissions({
                allowedDevices: [devicesByRole.listOwner],
                deniedDevices: [devices[1]],
                operation: (device) =>
                    device.storage.serverModules.contentSharing.removeAnnotationsFromLists(
                        {
                            sharedListReferences: [listReference],
                            sharedAnnotationReferences: [
                                sharedAnnotationReference,
                            ],
                        },
                    ),
            })
        })

        it(`should by default not allow users to add roles to each others' lists`, async (context) => {
            const { devices, devicesByRole, listReference } = await setupTest(
                context,
            )

            await expectPermissions({
                allowedDevices: [devicesByRole.listOwner],
                deniedDevices: [devices[1]],
                operation: (device) =>
                    device.storage.serverModules.contentSharing.createListRole({
                        listReference,
                        userReference: device.services.auth.getCurrentUserReference()!,
                        roleID: SharedListRoleID.AddOnly,
                    }),
            })
        })

        // it(`should by default not allow users to remove roles from each others' lists`, async (context) => {
        //     const { devices, listReference } = await setupTest(context)

        //     await devices[0].storage.serverModules.contentSharing.createListRole({
        //         listReference,
        //         userReference: devices[0].services.auth.getCurrentUserReference()!,
        //         roleID: SharedListRoleID.AddOnly,
        //     })

        //     await expectPermissions({
        //         allowedDevices: [devicesByRole.listOwner],
        //         deniedDevices: [devices[1]],
        //         operation: device => device.storage.serverModules.contentSharing.removeListRole({
        //             listReference,
        //             userReference: device.services.auth.getCurrentUserReference()!,
        //         })
        //     })
        // })

        it('should support the entire flow of generating a list key and using it to get add only access', async (context) => {
            const superuserDevice = await context.createSuperuserDevice()
            const { devices, devicesByRole, listReference } = await setupTest(
                context,
            )
            const {
                keyString,
            } = await devicesByRole.listOwner.storage.serverModules.contentSharing.createListKey(
                {
                    listReference,
                    key: {
                        roleID: SharedListRoleID.AddOnly,
                    },
                },
            )
            expect(
                await devicesByRole.listOwner.storage.serverModules.contentSharing.getListKeys(
                    {
                        listReference,
                    },
                ),
            ).toEqual([
                {
                    reference: {
                        id: keyString,
                        type: 'shared-list-key-reference',
                    },
                    sharedList: {
                        id: listReference.id,
                        type: 'shared-list-reference',
                    },
                    createdWhen: expect.any(Number),
                    updatedWhen: expect.any(Number),
                    roleID: SharedListRoleID.AddOnly,
                    disabled: false,
                },
            ])
            await processListKey({
                keyString,
                listReference,
                userReference: devices[1].services.auth.getCurrentUserReference()!,
                storageModules: superuserDevice.storage.serverModules,
                services: {},
                storageManager: superuserDevice.storage.serverStorageManager,
            })
            expect(
                await devicesByRole.listOwner.storage.serverModules.contentSharing.getListRole(
                    {
                        listReference,
                        userReference: devices[1].services.auth.getCurrentUserReference()!,
                    },
                ),
            ).toEqual(
                expect.objectContaining({
                    roleID: SharedListRoleID.AddOnly,
                }),
            )
            expect(
                await devicesByRole.listOwner.storage.serverModules.contentSharing.getListRoles(
                    {
                        listReference,
                    },
                ),
            ).toEqual([
                expect.objectContaining({
                    user: devices[1].services.auth.getCurrentUserReference()!,
                    roleID: SharedListRoleID.AddOnly,
                }),
            ])
            await data.createTestListEntries({
                listReference: listReference,
                contentSharing: devices[1].storage.serverModules.contentSharing,
                userReference: devices[1].services.auth.getCurrentUserReference()!,
            })
            expect(
                await devices[0].storage.serverModules.contentSharing.retrieveList(
                    listReference,
                ),
            ).toEqual(
                expect.objectContaining({
                    creator: devices[0].services.auth.getCurrentUserReference()!,
                    entries: [
                        expect.objectContaining({}),
                        expect.objectContaining({}),
                    ],
                }),
            )
        })
    },
)

async function expectPermissions(params: {
    allowedDevices: StorageTestDevice[]
    deniedDevices: StorageTestDevice[]
    operation: (device: StorageTestDevice) => Promise<void>
}) {
    for (const device of params.deniedDevices) {
        await expectPermissionsError(() => params.operation(device))
    }
    for (const device of params.allowedDevices) {
        await expectNoPermissionsError(() => params.operation(device))
    }
}

async function expectPermissionsError(f: () => Promise<void>) {
    await _expectPermissionsError(f, true)
}

async function expectNoPermissionsError(f: () => Promise<void>) {
    await f()
}

async function _expectPermissionsError(
    f: () => Promise<void>,
    expected: boolean,
) {
    let triggeredPermissionError = false
    try {
        await f()
    } catch (e) {
        if (!isAccessRulesPermissionError(e as any)) {
            throw e
        }
        triggeredPermissionError = true
    }
    expect({ triggeredPermissionError }).toEqual({
        triggeredPermissionError: expected,
    })
}
