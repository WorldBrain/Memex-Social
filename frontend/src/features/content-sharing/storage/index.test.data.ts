import flatten from 'lodash/flatten'
import fromPairs from 'lodash/fromPairs'
import ContentSharingStorage from "."
import { SharedListReference } from "@worldbrain/memex-common/lib/content-sharing/types"
import { UserReference } from "@worldbrain/memex-common/lib/web-interface/types/users"

export const TEST_ANNOTATIONS_BY_PAGE = {
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
    'bar.com/page-2': [
        {
            createdWhen: 2000,
            localId: 'bar.com/page-2#2000',
            body: 'Body 3',
            comment: 'Comment 3',
            selector: 'Selector 3',
        },
    ],
}
export const TEST_ANNOTATION_PAGE_URLS_BY_LOCAL_ID = fromPairs(flatten(
    Object.entries(TEST_ANNOTATIONS_BY_PAGE).map(([normalizedPageUrl, annotationDati]) =>
        annotationDati.map(annotationData => [annotationData.localId, { normalizedPageUrl }])
    )
))

export async function createTestListEntries(params: {
    contentSharing: ContentSharingStorage, listReference: SharedListReference, userReference: UserReference
}) {
    await params.contentSharing.createListEntries({
        listReference: params.listReference,
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
        userReference: params.userReference
    })
}

export async function createTestAnnotations(params: {
    contentSharing: ContentSharingStorage, listReference: SharedListReference, userReference: UserReference
}) {
    return params.contentSharing.createAnnotations({
        listReferences: [params.listReference],
        creator: params.userReference,
        annotationsByPage: TEST_ANNOTATIONS_BY_PAGE
    })
}
