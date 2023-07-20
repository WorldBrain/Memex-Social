import flatten from 'lodash/flatten'
import fromPairs from 'lodash/fromPairs'
import ContentSharingStorage from '.'
import { SharedListReference } from '@worldbrain/memex-common/lib/content-sharing/types'
import { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import {
    FingerprintSchemeType,
    LocationSchemeType,
} from '@worldbrain/memex-common/lib/personal-cloud/storage/types'

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
    'memex.cloud/ct/test-fingerprint-1.pdf': [
        {
            createdWhen: 2500,
            localId: 'memex.cloud/ct/test-fingerprint-1.pdf#2500',
            body: 'Body 4',
            comment: 'Comment 4',
            selector: 'Selector 4',
        },
    ],
}
export const TEST_ANNOTATION_PAGE_URLS_BY_LOCAL_ID = fromPairs(
    flatten(
        Object.entries(
            TEST_ANNOTATIONS_BY_PAGE,
        ).map(([normalizedPageUrl, annotationDati]) =>
            annotationDati.map((annotationData) => [
                annotationData.localId,
                { normalizedPageUrl, ...annotationData },
            ]),
        ),
    ),
)

export const TEST_PDF_LIST_ENTRY = {
    entryTitle: 'PDF Page 1',
    originalUrl: 'https://memex.cloud/ct/test-fingerprint-1.pdf',
    normalizedUrl: 'memex.cloud/ct/test-fingerprint-1.pdf',
    createdWhen: 590,
}

export const TEST_LIST_ENTRIES = [
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
    TEST_PDF_LIST_ENTRY,
]

export const TEST_LOCATORS = [
    {
        locationScheme: LocationSchemeType.NormalizedUrlV1,
        originalUrl: 'https://www.bar.com/test-pdf.pdf',
    },
]

export const TEST_FINGERPRINTS = [
    {
        fingerprintScheme: FingerprintSchemeType.PdfV1,
        fingerprint: 'test-fingerprint-1',
    },
    {
        fingerprintScheme: FingerprintSchemeType.PdfV1,
        fingerprint: 'test-fingerprint-2',
    },
]

export async function createTestListEntries(params: {
    contentSharing: ContentSharingStorage
    listReference: SharedListReference
    userReference: UserReference
}) {
    await params.contentSharing.createListEntries({
        listReference: params.listReference,
        listEntries: TEST_LIST_ENTRIES,
        userReference: params.userReference,
    })
    await params.contentSharing.createLocatorsAndFingerprintsForList({
        creator: params.userReference,
        listReferences: [params.listReference],
        normalizedPageUrl: TEST_PDF_LIST_ENTRY.normalizedUrl,
        fingerprints: TEST_FINGERPRINTS,
        locators: TEST_LOCATORS,
    })
}

export async function createTestAnnotations(params: {
    contentSharing: ContentSharingStorage
    listReference: SharedListReference
    userReference: UserReference
}) {
    return params.contentSharing.createAnnotations({
        listReferences: [params.listReference],
        creator: params.userReference,
        annotationsByPage: TEST_ANNOTATIONS_BY_PAGE,
    })
}
