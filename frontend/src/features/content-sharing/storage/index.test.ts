import flatten from 'lodash/flatten'
import omit from 'lodash/omit'
import sortBy from 'lodash/sortBy'
import expect from 'expect'
import { createStorageTestSuite } from '../../../tests/storage-tests'
import * as data from './index.test.data'

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
        await data.createTestListEntries({
            contentSharing, listReference, userReference
        })
        const retrieved = (await contentSharing.retrieveList(listReference))!
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
        await data.createTestListEntries({
            contentSharing, listReference, userReference
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

    it('should store and retrieve page info', { withTestUser: true }, async ({ storage, services }) => {
        const { contentSharing } = storage.serverModules
        const userReference = services.auth.getCurrentUserReference()!
        const pageInfo = {
            ...data.TEST_LIST_ENTRIES[0],
            fullTitle: data.TEST_LIST_ENTRIES[0].entryTitle,
        }
        delete pageInfo.entryTitle
        const originalPageReference = await contentSharing.createPageInfo({
            pageInfo,
            creatorReference: userReference
        })
        const linkId = contentSharing.getSharedPageInfoLinkID(originalPageReference)
        expect(linkId).toEqual(expect.any(String))
        const pageReferenceFromId = contentSharing.getSharedPageInfoReferenceFromLinkID(linkId)
        expect(pageReferenceFromId).toEqual(originalPageReference)
        expect(await contentSharing.getPageInfo(pageReferenceFromId)).toEqual({
            reference: originalPageReference,
            pageInfo: {
                ...pageInfo,
                createdWhen: expect.any(Number),
                updatedWhen: expect.any(Number),
            },
            creatorReference: userReference,
        })
    })

    it('should ensure page info objects', { withTestUser: true }, async ({ storage, services }) => {
        const { contentSharing } = storage.serverModules
        const userReference = services.auth.getCurrentUserReference()!
        const pageInfo = {
            ...data.TEST_LIST_ENTRIES[0],
            fullTitle: data.TEST_LIST_ENTRIES[0].entryTitle,
        }
        delete pageInfo.entryTitle
        const firstPageReference = await contentSharing.ensurePageInfo({
            pageInfo,
            creatorReference: userReference
        })
        const secondPageReference = await contentSharing.ensurePageInfo({
            pageInfo,
            creatorReference: userReference
        })
        expect(firstPageReference).toEqual(secondPageReference)
        expect(await storage.serverStorageManager.collection('sharedPageInfo').findObjects({})).toEqual([
            expect.objectContaining({ normalizedUrl: data.TEST_LIST_ENTRIES[0].normalizedUrl })
        ])
    })

    it('should store and retrieve annotations', { withTestUser: true }, async ({ storage, services }) => {
        const { contentSharing } = storage.serverModules
        const userReference = services.auth.getCurrentUserReference()!
        const listReference1 = await contentSharing.createSharedList({
            listData: {
                title: 'My list'
            },
            localListId: 55,
            userReference
        })
        await data.createTestListEntries({ contentSharing, listReference: listReference1, userReference })
        await data.createTestAnnotations({ contentSharing, listReference: listReference1, userReference })
        const listReference2 = await contentSharing.createSharedList({
            listData: {
                title: 'My list 2'
            },
            localListId: 75,
            userReference
        })
        await data.createTestListEntries({ contentSharing, listReference: listReference2, userReference })
        const creationResult = await data.createTestAnnotations({ contentSharing, listReference: listReference2, userReference })
        expect(creationResult).toEqual({
            sharedAnnotationReferences: {
                [data.TEST_ANNOTATIONS_BY_PAGE['foo.com/page-1'][0].localId]: expect.objectContaining({ type: 'shared-annotation-reference' }),
                [data.TEST_ANNOTATIONS_BY_PAGE['foo.com/page-1'][1].localId]: expect.objectContaining({ type: 'shared-annotation-reference' }),
                [data.TEST_ANNOTATIONS_BY_PAGE['bar.com/page-2'][0].localId]: expect.objectContaining({ type: 'shared-annotation-reference' }),
            }
        })

        const getRemoteId = <PageUrl extends keyof typeof data.TEST_ANNOTATIONS_BY_PAGE>(

            normalizedPageUrl: PageUrl,
            annotationIndex: number
        ) =>
            contentSharing._idFromReference(
                creationResult.sharedAnnotationReferences[
                data.TEST_ANNOTATIONS_BY_PAGE[normalizedPageUrl][annotationIndex].localId
                ] as any
            )
        expect(await contentSharing.getAnnotationsForPagesInList({
            listReference: listReference2,
            normalizedPageUrls: ['foo.com/page-1', 'bar.com/page-2']
        })).toEqual({
            "foo.com/page-1": [
                {
                    annotation: {
                        id: getRemoteId('foo.com/page-1', 0),
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
                        id: getRemoteId('foo.com/page-1', 1),
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
                        id: getRemoteId('bar.com/page-2', 0),
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

    it('should retrieve a random user list entry for a normalized page URL', { withTestUser: true }, async ({ storage, services }) => {
        const { contentSharing } = storage.serverModules
        const userReference = services.auth.getCurrentUserReference()!
        const listReference1 = await contentSharing.createSharedList({
            listData: {
                title: 'My list'
            },
            localListId: 55,
            userReference
        })
        await data.createTestListEntries({ contentSharing, listReference: listReference1, userReference })
        const retrievedEntry = await contentSharing.getRandomUserListEntryForUrl({
            creatorReference: userReference,
            normalizedUrl: 'bar.com/page-2'
        })
        expect(retrievedEntry).toEqual({
            entry: {
                entryTitle: 'Page 2',
                originalUrl: 'https://www.bar.com/page-2',
                normalizedUrl: 'bar.com/page-2',
                createdWhen: 592,
                updatedWhen: expect.any(Number),
            },
        })
    })

    it('should retrieve single annotations', { withTestUser: true }, async ({ storage, services }) => {
        const { contentSharing } = storage.serverModules
        const userReference = services.auth.getCurrentUserReference()!
        const listReference1 = await contentSharing.createSharedList({
            listData: {
                title: 'My list'
            },
            localListId: 55,
            userReference
        })
        await data.createTestListEntries({ contentSharing, listReference: listReference1, userReference })
        const creationResult = await data.createTestAnnotations({ contentSharing, listReference: listReference1, userReference })
        const annotationReference = creationResult.sharedAnnotationReferences[data.TEST_ANNOTATIONS_BY_PAGE['bar.com/page-2'][0].localId]
        const retrievedAnnotation = await contentSharing.getAnnotation({ reference: annotationReference })
        expect(retrievedAnnotation).toEqual({
            annotation: {
                ...data.TEST_ANNOTATIONS_BY_PAGE['bar.com/page-2'][0],
                normalizedPageUrl: 'bar.com/page-2',
                uploadedWhen: expect.any(Number),
                updatedWhen: expect.any(Number),
                localId: undefined
            },
            creatorReference: userReference
        })
    })

    it('should retrieve all annotations by creator and URL', { withTestUser: true }, async ({ storage, services }) => {
        const { contentSharing } = storage.serverModules
        const userReference = services.auth.getCurrentUserReference()!
        const listReference = await contentSharing.createSharedList({
            listData: {
                title: 'My list'
            },
            localListId: 55,
            userReference
        })
        await data.createTestListEntries({ contentSharing, listReference: listReference, userReference })
        await data.createTestAnnotations({ contentSharing, listReference: listReference, userReference })
        const retrievedAnnotations = await contentSharing.getAnnotationsByCreatorAndPageUrl({
            creatorReference: userReference,
            normalizedPageUrl: 'foo.com/page-1'
        })
        expect(retrievedAnnotations).toEqual([
            {
                linkId: contentSharing.getSharedAnnotationLinkID(retrievedAnnotations[0].reference),
                reference: expect.objectContaining({ type: 'shared-annotation-reference' }),
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
                linkId: contentSharing.getSharedAnnotationLinkID(retrievedAnnotations[1].reference),
                reference: expect.objectContaining({ type: 'shared-annotation-reference' }),
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
    })

    it('should retrieve all annotation entries for a list and get those annotations', { withTestUser: true }, async ({ storage, services }) => {
        const { contentSharing } = storage.serverModules
        const userReference = services.auth.getCurrentUserReference()!
        const listReference1 = await contentSharing.createSharedList({
            listData: {
                title: 'My list'
            },
            localListId: 55,
            userReference
        })
        await data.createTestListEntries({ contentSharing, listReference: listReference1, userReference })
        await data.createTestAnnotations({ contentSharing, listReference: listReference1, userReference })
        const listReference2 = await contentSharing.createSharedList({
            listData: {
                title: 'My list 2'
            },
            localListId: 75,
            userReference
        })
        await data.createTestListEntries({ contentSharing, listReference: listReference2, userReference })
        await data.createTestAnnotations({ contentSharing, listReference: listReference2, userReference })

        const entries = await contentSharing.getAnnotationListEntries({ listReference: listReference1 })
        expect(entries).toEqual({
            'bar.com/page-2': [
                {
                    reference: expect.objectContaining({ type: 'shared-annotation-list-entry-reference' }),
                    creator: userReference,
                    sharedList: listReference1,
                    sharedAnnotation: expect.objectContaining({ type: 'shared-annotation-reference' }),
                    normalizedPageUrl: 'bar.com/page-2',
                    createdWhen: 2000,
                    uploadedWhen: expect.any(Number),
                    updatedWhen: expect.any(Number),
                }
            ],
            'foo.com/page-1': [
                {
                    reference: expect.objectContaining({ type: 'shared-annotation-list-entry-reference' }),
                    creator: userReference,
                    sharedList: listReference1,
                    sharedAnnotation: expect.objectContaining({ type: 'shared-annotation-reference' }),
                    normalizedPageUrl: 'foo.com/page-1',
                    createdWhen: 500,
                    uploadedWhen: expect.any(Number),
                    updatedWhen: expect.any(Number),
                },
                {
                    reference: expect.objectContaining({ type: 'shared-annotation-list-entry-reference' }),
                    creator: userReference,
                    sharedList: listReference1,
                    sharedAnnotation: expect.objectContaining({ type: 'shared-annotation-reference' }),
                    normalizedPageUrl: 'foo.com/page-1',
                    createdWhen: 1500,
                    uploadedWhen: expect.any(Number),
                    updatedWhen: expect.any(Number),
                },
            ]
        })

        expect(await contentSharing.getAnnotations({
            references: flatten(Object.values(entries).map(entries => entries.map(entry => entry.sharedAnnotation))),
        })).toEqual({
            [contentSharing.getSharedAnnotationLinkID(entries['foo.com/page-1'][0].sharedAnnotation)]: {
                linkId: expect.any(String),
                reference: expect.objectContaining({ type: 'shared-annotation-reference' }),
                creator: userReference,
                normalizedPageUrl: 'foo.com/page-1',
                createdWhen: 500,
                uploadedWhen: expect.any(Number),
                updatedWhen: expect.any(Number),
                body: 'Body 1',
                comment: 'Comment 1',
                selector: 'Selector 1',
            },
            [contentSharing.getSharedAnnotationLinkID(entries['foo.com/page-1'][1].sharedAnnotation)]: {
                linkId: expect.any(String),
                reference: expect.objectContaining({ type: 'shared-annotation-reference' }),
                creator: userReference,
                createdWhen: 1500,
                uploadedWhen: expect.any(Number),
                updatedWhen: expect.any(Number),
                normalizedPageUrl: 'foo.com/page-1',
                body: 'Body 2',
                comment: 'Comment 2',
                selector: 'Selector 2',
            },
            [contentSharing.getSharedAnnotationLinkID(entries['bar.com/page-2'][0].sharedAnnotation)]: {
                linkId: expect.any(String),
                reference: expect.objectContaining({ type: 'shared-annotation-reference' }),
                creator: userReference,
                normalizedPageUrl: 'bar.com/page-2',
                createdWhen: 2000,
                uploadedWhen: expect.any(Number),
                updatedWhen: expect.any(Number),
                body: 'Body 3',
                comment: 'Comment 3',
                selector: 'Selector 3',
            },
        })
    })

    it('should add an existing annotation to a new list', { withTestUser: true }, async ({ storage, services }) => {
        const { contentSharing } = storage.serverModules
        const userReference = services.auth.getCurrentUserReference()!
        const listReference1 = await contentSharing.createSharedList({
            listData: {
                title: 'My list'
            },
            localListId: 55,
            userReference
        })
        await data.createTestListEntries({ contentSharing, listReference: listReference1, userReference })
        const { sharedAnnotationReferences } = await data.createTestAnnotations({ contentSharing, listReference: listReference1, userReference })
        const listReference2 = await contentSharing.createSharedList({
            listData: {
                title: 'My list 2'
            },
            localListId: 75,
            userReference
        })
        await data.createTestListEntries({ contentSharing, listReference: listReference2, userReference })
        await contentSharing.addAnnotationsToLists({
            creator: userReference,
            sharedListReferences: [listReference2],
            sharedAnnotations: Object.entries(sharedAnnotationReferences).map(([localId, reference]) => ({
                reference,
                normalizedPageUrl: data.TEST_ANNOTATION_PAGE_URLS_BY_LOCAL_ID[localId].normalizedPageUrl,
                createdWhen: data.TEST_ANNOTATION_PAGE_URLS_BY_LOCAL_ID[localId].createdWhen,
            })),
        })

        expect(await contentSharing.getAnnotationsForPagesInList({
            listReference: listReference2,
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

    it('should remove an existing annotation from a list', { withTestUser: true }, async ({ storage, services }) => {
        const { contentSharing } = storage.serverModules
        const userReference = services.auth.getCurrentUserReference()!
        const listReference1 = await contentSharing.createSharedList({
            listData: {
                title: 'My list'
            },
            localListId: 55,
            userReference
        })
        await data.createTestListEntries({ contentSharing, listReference: listReference1, userReference })
        const creationResult = await data.createTestAnnotations({ contentSharing, listReference: listReference1, userReference })
        await contentSharing.removeAnnotationsFromLists({
            sharedListReferences: [listReference1],
            sharedAnnotationReferences: [
                creationResult.sharedAnnotationReferences[data.TEST_ANNOTATIONS_BY_PAGE['bar.com/page-2'][0].localId],
                creationResult.sharedAnnotationReferences[data.TEST_ANNOTATIONS_BY_PAGE['foo.com/page-1'][1].localId],
            ]
        })

        expect(await contentSharing.getAnnotationsForPagesInList({
            listReference: listReference1,
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
            ],
        })
    })

    it('should remove an annotation and all its list entries', { withTestUser: true }, async ({ storage, services }) => {
        const { contentSharing } = storage.serverModules
        const userReference = services.auth.getCurrentUserReference()!
        const listReference1 = await contentSharing.createSharedList({
            listData: {
                title: 'My list'
            },
            localListId: 55,
            userReference
        })
        await data.createTestListEntries({ contentSharing, listReference: listReference1, userReference })
        const creationResult = await data.createTestAnnotations({ contentSharing, listReference: listReference1, userReference })
        await contentSharing.removeAnnotations({
            sharedAnnotationReferences: [
                creationResult.sharedAnnotationReferences[data.TEST_ANNOTATIONS_BY_PAGE['bar.com/page-2'][0].localId],
                creationResult.sharedAnnotationReferences[data.TEST_ANNOTATIONS_BY_PAGE['foo.com/page-1'][1].localId],
            ]
        })

        expect(await contentSharing.getAnnotationsForPagesInList({
            listReference: listReference1,
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
            ],
        })
        expect(await storage.serverStorageManager.operation('findObjects', 'sharedAnnotation', {})).toEqual([
            expect.objectContaining({
                normalizedPageUrl: 'foo.com/page-1',
            })
        ])
    })

    it('should update the comment of a shared annotation', { withTestUser: true }, async ({ storage, services }) => {
        const { contentSharing } = storage.serverModules
        const userReference = services.auth.getCurrentUserReference()!
        const listReference1 = await contentSharing.createSharedList({
            listData: {
                title: 'My list'
            },
            localListId: 55,
            userReference
        })
        await data.createTestListEntries({ contentSharing, listReference: listReference1, userReference })
        const creationResult = await data.createTestAnnotations({ contentSharing, listReference: listReference1, userReference })
        const sharedAnnotationReference = creationResult.sharedAnnotationReferences[
            data.TEST_ANNOTATIONS_BY_PAGE['foo.com/page-1'][1].localId
        ]
        await contentSharing.updateAnnotationComment({
            sharedAnnotationReference,
            updatedComment: 'Updated comment'
        })
        expect(await contentSharing.getAnnotationsForPagesInList({
            listReference: listReference1,
            normalizedPageUrls: ['foo.com/page-1', 'bar.com/page-2']
        })).toEqual({
            "foo.com/page-1": [
                {
                    annotation: expect.objectContaining({
                        body: "Body 1",
                        comment: "Comment 1",
                        selector: "Selector 1",
                    }),
                },
                {
                    annotation: expect.objectContaining({
                        body: "Body 2",
                        comment: "Updated comment",
                        selector: "Selector 2",
                    }),
                },
            ],
            "bar.com/page-2": [
                {
                    annotation: expect.objectContaining({
                        body: "Body 3",
                        comment: "Comment 3",
                        selector: "Selector 3",
                    }),
                },
            ],
        })
    })
})
