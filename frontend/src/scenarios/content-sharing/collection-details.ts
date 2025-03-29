import { ScenarioMap } from '../../services/scenarios/types'
import { scenario } from '../../services/scenarios/utils'
import {
    CollectionDetailsEvent,
    CollectionDetailsSignal,
} from '../../features/content-sharing/ui/pages/collection-details/types'
import {
    SharedAnnotationReference,
    SharedListRoleID,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import { ListShareModalEvent } from '@worldbrain/memex-common/lib/content-sharing/ui/list-share-modal/types'

type Targets = {
    CollectionDetailsPage: {
        events: CollectionDetailsEvent
        signals: CollectionDetailsSignal
    }
    ListShareModal: {
        events: ListShareModalEvent
    }
}

const getKeyStringFromLink = (link: string): string => link.split('key=')[1]

export const SCENARIOS: ScenarioMap<Targets> = {
    default: scenario<Targets>(({ step, callModification }) => ({
        fixture: 'default-lists-with-user',
        startRoute: {
            route: 'collectionDetails',
            params: { id: 'default-list' },
        },
        setup: {
            callModifications: ({ storage }) => [
                callModification({
                    name: 'block-list-loading',
                    object: storage.serverModules.contentSharing,
                    property: 'retrieveList',
                    modifier: 'block',
                }),
            ],
            // waitForSignal: {
            //     target: 'CollectionDetailsPage',
            //     signal: { type: 'loading-started' },
            // },
        },
        steps: [
            step({
                name: 'list-loaded',
                callModifications: ({ storage }) => [
                    callModification({
                        name: 'block-list-loading',
                        modifier: 'undo',
                    }),
                ],
                waitForSignal: { type: 'loaded-list-data', success: true },
            }),
        ],
    })),
    'list-load-error': scenario<Targets>(({ step, callModification }) => ({
        startRoute: {
            route: 'collectionDetails',
            params: { id: 'non-existing' },
        },
        setup: {
            callModifications: ({ storage }) => [
                callModification({
                    name: 'error-list-loading',
                    object: storage.serverModules.contentSharing,
                    property: 'retrieveList',
                    modifier: 'sabotage',
                }),
            ],
        },
        steps: [],
    })),
    'list-not-found': scenario<Targets>(({ step }) => ({
        startRoute: {
            route: 'collectionDetails',
            params: { id: 'non-existing' },
        },
        steps: [],
    })),
    'no-entries': scenario<Targets>(({ step }) => ({
        fixture: 'default-lists-with-user',
        startRoute: {
            route: 'collectionDetails',
            params: { id: 'no-entries-list' },
        },
        steps: [],
    })),
    'no-description': scenario<Targets>(({ step }) => ({
        fixture: 'default-lists-with-user',
        startRoute: {
            route: 'collectionDetails',
            params: { id: 'no-description-list' },
        },
        steps: [],
    })),
    'short-description': scenario<Targets>(({ step }) => ({
        fixture: 'default-lists-with-user',
        startRoute: {
            route: 'collectionDetails',
            params: { id: 'short-description-list' },
        },
        steps: [],
    })),
    'toggle-long-description': scenario<Targets>(({ step }) => ({
        fixture: 'default-lists-with-user',
        startRoute: {
            route: 'collectionDetails',
            params: { id: 'default-list' },
        },
        steps: [
            step({
                name: 'first-description-toggle',
                target: 'CollectionDetailsPage',
                eventName: 'toggleDescriptionTruncation',
                eventArgs: {},
            }),
            step({
                name: 'second-description-toggle',
                target: 'CollectionDetailsPage',
                eventName: 'toggleDescriptionTruncation',
                eventArgs: {},
            }),
        ],
    })),
    'list-entry-range': scenario<Targets>(({ step }) => ({
        fixture: 'default-lists-with-user',
        startRoute: {
            route: 'collectionDetails',
            params: { id: 'default-list' },
            query: {
                fromListEntry: '1594225279914',
                toListEntry: '1594225289914',
            },
        },
        steps: [],
    })),
    annotations: scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: {
            route: 'collectionDetails',
            params: { id: 'default-list' },
        },
        steps: [],
    })),
    'annotation-entry-range': scenario<Targets>(({ step }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: {
            route: 'collectionDetails',
            params: { id: 'default-list', entryId: 'entry-1' },
            query: {
                fromAnnotEntry: '1594225279914',
                toAnnotEntry: '1594225279914',
            },
        },
        steps: [],
    })),
    'annotation-toggle': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: {
            route: 'collectionDetails',
            params: { id: 'default-list' },
        },
        setup: {
            callModifications: ({ services }) => [
                callModification({
                    name: 'block-annotations-loading',
                    object: services.contentSharing.backend,
                    property: 'loadAnnotationsWithThreads',
                    modifier: 'block',
                }),
            ],
        },
        steps: [
            step({
                name: 'first-annotations-toggle',
                target: 'CollectionDetailsPage',
                eventName: 'togglePageAnnotations',
                eventArgs: {
                    normalizedUrl: 'getmemex.com',
                },
            }),
            step({
                name: 'annotations-loaded',
                callModifications: ({ storage }) => [
                    {
                        name: 'block-annotations-loading',
                        modifier: 'undo',
                    },
                ],
            }),
        ],
    })),
    'annotations-error': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: {
            route: 'collectionDetails',
            params: { id: 'default-list' },
        },
        setup: {
            callModifications: ({ storage }) => [
                callModification({
                    name: 'annotation-loading',
                    object: storage.serverModules.contentSharing,
                    property: 'getAnnotations',
                    modifier: 'sabotage',
                }),
            ],
        },
        steps: [
            step({
                name: 'first-annotations-toggle',
                target: 'CollectionDetailsPage',
                eventName: 'togglePageAnnotations',
                eventArgs: {
                    normalizedUrl: 'getmemex.com',
                },
            }),
        ],
    })),
    'toggle-all-annotations': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'annotated-list-with-user',
            startRoute: {
                route: 'collectionDetails',
                params: { id: 'default-list' },
            },
            setup: {
                callModifications: ({ storage }) => [
                    callModification({
                        name: 'first-annotations-loading',
                        object: storage.serverModules.contentSharing,
                        property: 'getAnnotations',
                        modifier: 'block',
                    }),
                ],
            },
            steps: [
                step({
                    name: 'all-annotations-toggle',
                    target: 'CollectionDetailsPage',
                    eventName: 'toggleAllAnnotations',
                    eventArgs: {},
                }),
                step({
                    name: 'first-annotations-loaded',
                    callModifications: ({ storage }) => [
                        {
                            name: 'first-annotations-loading',
                            modifier: 'undo',
                        },
                        {
                            name: 'second-annotations-loading',
                            object: storage.serverModules.contentSharing,
                            property: 'getAnnotations',
                            modifier: 'block',
                        },
                    ],
                }),
                step({
                    name: 'first-waypoint-hit',
                    target: 'CollectionDetailsPage',
                    eventName: 'pageBreakpointHit',
                    eventArgs: { entryIndex: 9 },
                }),
                step({
                    name: 'second-annotations-loaded',
                    callModifications: ({ storage }) => [
                        {
                            name: 'second-annotations-loading',
                            modifier: 'undo',
                        },
                    ],
                }),
            ],
        }),
    ),
    'cancel-new-page-comment': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'annotated-list-with-user',
            authenticated: true,
            startRoute: {
                route: 'collectionDetails',
                params: { id: 'default-list' },
            },
            steps: [
                step({
                    name: 'first-annotations-toggle',
                    target: 'CollectionDetailsPage',
                    waitForSignal: {
                        type: 'loaded-annotations',
                        success: true,
                    },
                    eventName: 'togglePageAnnotations',
                    eventArgs: {
                        normalizedUrl: 'getmemex.com',
                    },
                }),
                step({
                    name: 'initiate-comment',
                    target: 'CollectionDetailsPage',
                    eventName: 'initiateNewReplyToPage',
                    eventArgs: {
                        pageReplyId: 'getmemex.com',
                    },
                    waitForStep: 'first-annotations-toggle',
                }),
                step({
                    name: 'edit-comment',
                    target: 'CollectionDetailsPage',
                    eventName: 'editNewReplyToPage',
                    eventArgs: {
                        pageReplyId: 'getmemex.com',
                        content: 'this is a new comment',
                    },
                }),
                step({
                    name: 'cancel-comment',
                    target: 'CollectionDetailsPage',
                    eventName: 'cancelNewReplyToPage',
                    eventArgs: {
                        pageReplyId: 'getmemex.com',
                    },
                }),
                step({
                    name: 'second-initiate-comment',
                    target: 'CollectionDetailsPage',
                    eventName: 'initiateNewReplyToPage',
                    eventArgs: {
                        pageReplyId: 'getmemex.com',
                    },
                }),
            ],
        }),
    ),
    'confirm-new-page-comment': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'annotated-list-with-user',
            authenticated: true,
            startRoute: {
                route: 'collectionDetails',
                params: { id: 'default-list' },
            },
            steps: [
                step({
                    name: 'first-annotations-toggle',
                    target: 'CollectionDetailsPage',
                    waitForSignal: {
                        type: 'loaded-annotations',
                        success: true,
                    },
                    eventName: 'togglePageAnnotations',
                    eventArgs: {
                        normalizedUrl: 'getmemex.com',
                    },
                }),
                step({
                    name: 'initiate-comment',
                    target: 'CollectionDetailsPage',
                    eventName: 'initiateNewReplyToPage',
                    eventArgs: {
                        pageReplyId: 'getmemex.com',
                    },
                }),
                step({
                    name: 'edit-comment',
                    target: 'CollectionDetailsPage',
                    eventName: 'editNewReplyToPage',
                    eventArgs: {
                        pageReplyId: 'getmemex.com',
                        content: 'this is a new comment',
                    },
                }),
                step({
                    name: 'confirm-comment',
                    target: 'CollectionDetailsPage',
                    eventName: 'confirmNewReplyToPage',
                    eventArgs: {
                        pageReplyId: 'getmemex.com',
                        normalizedPageUrl: 'getmemex.com',
                        pageCreatorReference: {
                            type: 'user-reference',
                            id: 'default-user',
                        },
                        sharedListReference: {
                            type: 'shared-list-reference',
                            id: 'default-list',
                        },
                    },
                }),
                step({
                    name: 'second-initiate-comment',
                    target: 'CollectionDetailsPage',
                    eventName: 'initiateNewReplyToPage',
                    eventArgs: {
                        pageReplyId: 'getmemex.com',
                    },
                }),
            ],
        }),
    ),
    'new-page-comment-error': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'annotated-list-with-user',
            authenticated: true,
            startRoute: {
                route: 'collectionDetails',
                params: { id: 'default-list' },
            },
            setup: {
                callModifications: ({ storage }) => [
                    callModification({
                        name: 'reply-broken',
                        object: storage.serverModules.contentSharing,
                        property: 'createAnnotations',
                        modifier: 'sabotage',
                    }),
                ],
            },
            steps: [
                step({
                    name: 'first-annotations-toggle',
                    target: 'CollectionDetailsPage',
                    waitForSignal: {
                        type: 'loaded-annotations',
                        success: true,
                    },
                    eventName: 'togglePageAnnotations',
                    eventArgs: {
                        normalizedUrl: 'getmemex.com',
                    },
                }),
                step({
                    name: 'initiate-comment',
                    target: 'CollectionDetailsPage',
                    eventName: 'initiateNewReplyToPage',
                    eventArgs: {
                        pageReplyId: 'getmemex.com',
                    },
                }),
                step({
                    name: 'edit-comment',
                    target: 'CollectionDetailsPage',
                    eventName: 'editNewReplyToPage',
                    eventArgs: {
                        pageReplyId: 'getmemex.com',
                        content: 'this is a new comment',
                    },
                }),
                step({
                    name: 'confirm-comment',
                    target: 'CollectionDetailsPage',
                    eventName: 'confirmNewReplyToPage',
                    eventArgs: {
                        pageReplyId: 'getmemex.com',
                        normalizedPageUrl: 'getmemex.com',
                        pageCreatorReference: {
                            type: 'user-reference',
                            id: 'default-user',
                        },
                        sharedListReference: {
                            type: 'shared-list-reference',
                            id: 'default-list',
                        },
                    },
                }),
            ],
        }),
    ),
    'cancel-new-conversation': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'annotated-list-with-user',
            authenticated: true,
            startRoute: {
                route: 'collectionDetails',
                params: { id: 'default-list' },
            },
            steps: [
                step({
                    name: 'first-annotations-toggle',
                    target: 'CollectionDetailsPage',
                    waitForSignal: {
                        type: 'loaded-annotations',
                        success: true,
                    },
                    eventName: 'togglePageAnnotations',
                    eventArgs: {
                        normalizedUrl: 'getmemex.com',
                    },
                }),
                step({
                    name: 'initiate-reply',
                    target: 'CollectionDetailsPage',
                    eventName: 'initiateNewReplyToAnnotation',
                    eventArgs: {
                        annotationReference: {
                            type: 'shared-annotation-reference',
                            id: 'default-annotation',
                        },
                        sharedListReference: {
                            type: 'shared-list-reference',
                            id: 'default-list',
                        },
                    },
                }),
                step({
                    name: 'edit-reply',
                    target: 'CollectionDetailsPage',
                    eventName: 'editNewReplyToAnnotation',
                    eventArgs: {
                        annotationReference: {
                            type: 'shared-annotation-reference',
                            id: 'default-annotation',
                        },
                        content: 'this is a new reply',
                        sharedListReference: {
                            type: 'shared-list-reference',
                            id: 'default-list',
                        },
                    },
                }),
                step({
                    name: 'cancel-reply',
                    target: 'CollectionDetailsPage',
                    eventName: 'cancelNewReplyToAnnotation',
                    eventArgs: {
                        annotationReference: {
                            type: 'shared-annotation-reference',
                            id: 'default-annotation',
                        } as SharedAnnotationReference,
                        sharedListReference: {
                            type: 'shared-list-reference',
                            id: 'default-list',
                        },
                    },
                }),
                step({
                    name: 'second-initiate-reply',
                    target: 'CollectionDetailsPage',
                    eventName: 'initiateNewReplyToAnnotation',
                    eventArgs: {
                        annotationReference: {
                            type: 'shared-annotation-reference',
                            id: 'default-annotation',
                        },
                        sharedListReference: {
                            type: 'shared-list-reference',
                            id: 'default-list',
                        },
                    },
                }),
            ],
        }),
    ),
    'confirm-new-conversation': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'annotated-list-with-user',
            authenticated: true,
            startRoute: {
                route: 'collectionDetails',
                params: { id: 'default-list' },
            },
            steps: [
                step({
                    name: 'first-annotations-toggle',
                    target: 'CollectionDetailsPage',
                    waitForSignal: {
                        type: 'loaded-annotations',
                        success: true,
                    },
                    eventName: 'togglePageAnnotations',
                    eventArgs: {
                        normalizedUrl: 'getmemex.com',
                    },
                }),
                step({
                    name: 'initiate-reply',
                    target: 'CollectionDetailsPage',
                    eventName: 'initiateNewReplyToAnnotation',
                    eventArgs: {
                        annotationReference: {
                            type: 'shared-annotation-reference',
                            id: 'default-annotation',
                        },
                        sharedListReference: {
                            type: 'shared-list-reference',
                            id: 'default-list',
                        },
                    },
                }),
                step({
                    name: 'edit-reply',
                    target: 'CollectionDetailsPage',
                    eventName: 'editNewReplyToAnnotation',
                    eventArgs: {
                        annotationReference: {
                            type: 'shared-annotation-reference',
                            id: 'default-annotation',
                        },
                        content: 'this is a new reply',
                        sharedListReference: {
                            type: 'shared-list-reference',
                            id: 'default-list',
                        },
                    },
                }),
                step({
                    name: 'confirm-reply',
                    target: 'CollectionDetailsPage',
                    eventName: 'confirmNewReplyToAnnotation',
                    eventArgs: {
                        annotationReference: {
                            type: 'shared-annotation-reference',
                            id: 'default-annotation',
                        },
                        sharedListReference: {
                            type: 'shared-list-reference',
                            id: 'default-list',
                        },
                    },
                }),
                step({
                    name: 'second-initiate-reply',
                    target: 'CollectionDetailsPage',
                    eventName: 'initiateNewReplyToAnnotation',
                    eventArgs: {
                        annotationReference: {
                            type: 'shared-annotation-reference',
                            id: 'default-annotation',
                        },
                        sharedListReference: {
                            type: 'shared-list-reference',
                            id: 'default-list',
                        },
                    },
                }),
            ],
        }),
    ),
    'existing-conversation': scenario<Targets>(
        ({ step, callModification }) => ({
            authenticated: true,
            fixture: 'annotation-coversation-with-user',
            startRoute: {
                route: 'collectionDetails',
                params: { id: 'default-list' },
            },
            setup: {
                // TODO: this is commented out as unblocking it somehow stopped doesn't work, thus breaking all the subsequent steps
                // callModifications: ({ storage }) => [
                //     callModification({
                //         name: 'threads-loading',
                //         object: storage.serverModules.contentConversations,
                //         property: 'getThreadsForAnnotations',
                //         modifier: 'block',
                //     }),
                // ],
            },
            steps: [
                step({
                    name: 'first-annotations-toggle',
                    target: 'CollectionDetailsPage',
                    waitForSignal: {
                        type: 'loaded-annotations',
                        success: true,
                    },
                    eventName: 'togglePageAnnotations',
                    eventArgs: {
                        normalizedUrl: 'getmemex.com',
                    },
                }),
                // step({
                //     name: 'threads-loaded',
                //     callModifications: () => [
                //         {
                //             name: 'threads-loading',
                //             modifier: 'undo',
                //         },
                //     ],
                // }),
                step({
                    name: 'toggle-replies',
                    target: 'CollectionDetailsPage',
                    eventName: 'toggleAnnotationReplies',
                    eventArgs: {
                        annotationReference: {
                            type: 'shared-annotation-reference',
                            id: 'default-annotation',
                        },
                        sharedListReference: {
                            type: 'shared-list-reference',
                            id: 'default-list',
                        },
                        skipNullListLookup: true,
                    },
                }),
                step({
                    name: 'initiate-reply',
                    target: 'CollectionDetailsPage',
                    eventName: 'initiateNewReplyToAnnotation',
                    eventArgs: {
                        annotationReference: {
                            type: 'shared-annotation-reference',
                            id: 'default-annotation',
                        },
                        sharedListReference: {
                            type: 'shared-list-reference',
                            id: 'default-list',
                        },
                    },
                }),
                step({
                    name: 'edit-reply',
                    target: 'CollectionDetailsPage',
                    eventName: 'editNewReplyToAnnotation',
                    eventArgs: {
                        annotationReference: {
                            type: 'shared-annotation-reference',
                            id: 'default-annotation',
                        },
                        content: 'this is a new reply',
                        sharedListReference: {
                            type: 'shared-list-reference',
                            id: 'default-list',
                        },
                    },
                }),
                step({
                    name: 'confirm-reply',
                    target: 'CollectionDetailsPage',
                    eventName: 'confirmNewReplyToAnnotation',
                    eventArgs: {
                        annotationReference: {
                            type: 'shared-annotation-reference',
                            id: 'default-annotation',
                        },
                        sharedListReference: {
                            type: 'shared-list-reference',
                            id: 'default-list',
                        },
                    },
                }),
                step({
                    name: 'second-initiate-reply',
                    target: 'CollectionDetailsPage',
                    eventName: 'initiateNewReplyToAnnotation',
                    eventArgs: {
                        annotationReference: {
                            type: 'shared-annotation-reference',
                            id: 'default-annotation',
                        },
                        sharedListReference: {
                            type: 'shared-list-reference',
                            id: 'default-list',
                        },
                    },
                }),
            ],
        }),
    ),
    'reply-range': scenario<Targets>(({ step, callModification }) => ({
        authenticated: true,
        fixture: 'annotation-coversation-with-user',
        startRoute: {
            route: 'pageView',
            params: { id: 'default-list', entryId: 'entry-1' },
            query: {
                annotationId: 'default-annotation',
                fromReply: '1594225289914',
                toReply: '1594225289914',
            },
        },
        steps: [],
    })),
    'page-link': scenario<Targets>(({ step }) => ({
        fixture: 'page-link-with-user',
        startRoute: {
            route: 'collectionDetails',
            params: { id: 'page-link', entryId: 'entry-id' },
        },
        steps: [],
    })),
    'large-data-set': scenario<Targets>(({ step }) => ({
        excludeFromMetaUI: true,
        fixture: {
            seed: 5,
            counts: {
                user: 1,
                sharedList: 1,
                sharedListEntry: 200,
                sharedAnnotation: 1000,
                sharedAnnotationListEntry: 5000,
            },
        },
        startRoute: {
            route: 'collectionDetails',
            params: { id: 'non-existing' },
        },
        steps: [],
    })),
    'user-with-followed-collections': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'annotated-list-with-user',
            authenticated: true,
            startRoute: {
                route: 'collectionDetails',
                params: { id: 'default-list' },
            },
            setup: {
                callModifications: ({ storage }) => [
                    callModification({
                        name: 'follows-loading',
                        object: storage.serverModules.activityFollows,
                        property: 'getAllFollowsByCollection',
                        modifier: 'block',
                    }),
                ],
                execute: async ({ storage, services }) => {
                    await storage.serverModules.activityFollows.storeFollow({
                        userReference: services.auth.getCurrentUserReference()!,
                        collection: 'sharedList',
                        objectId: 'default-list',
                    })
                },
            },
            steps: [
                step({
                    name: 'follows-loaded',
                    callModifications: ({ storage }) => [
                        {
                            name: 'follows-loading',
                            modifier: 'undo',
                        },
                    ],
                }),
            ],
        }),
    ),
    'follow-collection': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        authenticated: true,
        startRoute: {
            route: 'collectionDetails',
            params: { id: 'default-list' },
        },
        setup: {
            callModifications: ({ storage }) => [
                callModification({
                    name: 'following',
                    object: storage.serverModules.activityFollows,
                    property: 'storeFollow',
                    modifier: 'block',
                }),
            ],
        },
        steps: [
            step({
                name: 'follow-collection',
                target: 'CollectionDetailsPage',
                eventName: 'clickFollowBtn',
                eventArgs: {},
            }),
            step({
                name: 'follow-complete',
                callModifications: ({ storage }) => [
                    {
                        name: 'following',
                        modifier: 'undo',
                    },
                ],
            }),
        ],
    })),
    'unfollow-collection': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        authenticated: true,
        startRoute: {
            route: 'collectionDetails',
            params: { id: 'default-list' },
        },
        setup: {
            callModifications: ({ storage }) => [
                callModification({
                    name: 'unfollowing',
                    object: storage.serverModules.activityFollows,
                    property: 'deleteFollow',
                    modifier: 'block',
                }),
            ],
            execute: async ({ storage, services }) => {
                await storage.serverModules.activityFollows.storeFollow({
                    userReference: services.auth.getCurrentUserReference()!,
                    collection: 'sharedList',
                    objectId: 'default-list',
                })
            },
        },
        steps: [
            step({
                name: 'unfollow-collection',
                target: 'CollectionDetailsPage',
                eventName: 'clickFollowBtn',
                eventArgs: {},
            }),
            step({
                name: 'unfollow-complete',
                callModifications: () => [
                    {
                        name: 'unfollowing',
                        modifier: 'undo',
                    },
                ],
            }),
        ],
    })),
    'user-with-followed-collections-error': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'annotated-list-with-user-and-follows',
            authenticated: true,
            startRoute: {
                route: 'collectionDetails',
                params: { id: 'default-list' },
            },
            setup: {
                callModifications: ({ storage }) => [
                    callModification({
                        name: 'follows-error',
                        object: storage.serverModules.activityFollows,
                        property: 'getAllFollowsByCollection',
                        modifier: 'sabotage',
                    }),
                ],
            },
            steps: [],
        }),
    ),
    'user-with-followed-collections-follow-button': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'annotated-list-with-user-and-follows',
            authenticated: true,
            startRoute: {
                route: 'collectionDetails',
                params: { id: 'default-list' },
            },
            setup: {
                callModifications: ({ storage }) => [
                    callModification({
                        name: 'follow-btn-loading',
                        object: storage.serverModules.activityFollows,
                        property: 'isEntityFollowedByUser',
                        modifier: 'block',
                    }),
                ],
            },
            steps: [
                step({
                    name: 'follow-btn-loaded',
                    callModifications: ({ storage }) => [
                        {
                            name: 'follow-btn-loading',
                            modifier: 'undo',
                        },
                    ],
                }),
                step({
                    name: 'follow-btn-clicked',
                    target: 'CollectionDetailsPage',
                    eventName: 'clickFollowBtn',
                    eventArgs: {},
                }),
            ],
        }),
    ),
    'collection-share-modal': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'annotated-list-with-user-and-follows',
            authenticated: true,
            startRoute: {
                route: 'collectionDetails',
                params: { id: 'default-list' },
            },
            setup: {
                callModifications: ({ storage }) => [
                    callModification({
                        name: 'collection-share-modal-loading-block',
                        object: storage.serverModules.contentSharing,
                        property: 'getListKeys',
                        modifier: 'block',
                    }),
                    // TODO: figure out how to do multiple blocks
                    // callModification({
                    //     name: 'collection-share-modal-add-block',
                    //     object: storage.serverModules.contentSharing,
                    //     property: 'createListKey',
                    //     modifier: 'block',
                    // }),
                    // callModification({
                    //     name: 'collection-share-modal-delete-block',
                    //     object: storage.serverModules.contentSharing,
                    //     property: 'deleteListKey',
                    //     modifier: 'block',
                    // }),
                ],
            },
            steps: [
                step({
                    name: 'collection-share-modal-loading',
                    target: 'CollectionDetailsPage',
                    eventName: 'toggleListShareModal',
                    eventArgs: {},
                }),
                step({
                    name: 'collection-share-modal-loaded',
                    callModifications: ({ storage }) => [
                        {
                            name: 'collection-share-modal-loading-block',
                            modifier: 'undo',
                        },
                    ],
                }),
                // step({
                //     name: 'collection-share-modal-adding',
                //     target: 'ListShareModal',
                //     eventName: 'addLink',
                //     eventArgs: null,
                // }),
                // step({
                //     name: 'collection-share-modal-added',
                //     callModifications: ({ storage }) => [
                //         {
                //             name: 'collection-share-modal-add-block',
                //             modifier: 'undo',
                //         },
                //     ],
                // }),
                // step({
                //     name: 'collection-share-modal-delete-modal',
                //     target: 'ListShareModal',
                //     eventName: 'requestLinkDelete',
                //     eventArgs: { linkIndex: 0 },
                // }),
                // step({
                //     name: 'collection-share-modal-delete-modal-confirm',
                //     target: 'ListShareModal',
                //     eventName: 'confirmLinkDelete',
                //     eventArgs: null,
                // }),
                // step({
                //     name: 'collection-share-modal-delete-modal-done',
                //     callModifications: ({ storage }) => [
                //         {
                //             name: 'collection-share-modal-delete-block',
                //             modifier: 'undo',
                //         },
                //     ],
                // }),
                step({
                    name: 'collection-share-modal-clicked-away',
                    target: 'CollectionDetailsPage',
                    eventName: 'toggleListShareModal',
                    eventArgs: {},
                }),
            ],
        }),
    ),
    // 'collection-share-modal-add-link': scenario<Targets>(
    //     ({ step, callModification }) => ({
    //         fixture: 'annotated-list-with-user-and-follows',
    //         authenticated: true,
    //         startRoute: {
    //             route: 'collectionDetails',
    //             params: { id: 'default-list' },
    //         },
    //         setup: {
    //             callModifications: ({ storage }) => [
    //                 callModification({
    //                     name: 'collection-share-modal-add-sabotage',
    //                     object: storage.serverModules.contentSharing,
    //                     property: 'createListKey',
    //                     modifier: 'sabotage',
    //                 }),
    //                 callModification({
    //                     name: 'collection-share-modal-add-block',
    //                     object: storage.serverModules.contentSharing,
    //                     property: 'createListKey',
    //                     modifier: 'block',
    //                 }),
    //             ],
    //         },
    //         steps: [
    //             step({
    //                 name: 'collection-share-modal-loaded',
    //                 target: 'CollectionDetailsPage',
    //                 eventName: 'toggleListShareModal',
    //                 eventArgs: {},
    //             }),
    //             step({
    //                 name: 'collection-share-modal-failed-add',
    //                 target: 'ListShareModal',
    //                 eventName: 'addLink',
    //                 eventArgs: null,
    //             }),
    //             step({
    //                 name: 'collection-share-modal-fix-failure',
    //                 callModifications: ({ storage }) => [
    //                     {
    //                         name: 'collection-share-modal-add-sabotage',
    //                         modifier: 'undo',
    //                     },
    //                 ],
    //             }),
    //             step({
    //                 name: 'collection-share-modal-adding',
    //                 target: 'ListShareModal',
    //                 eventName: 'addLink',
    //                 eventArgs: null,
    //             }),
    //             step({
    //                 name: 'collection-share-modal-added',
    //                 callModifications: ({ storage }) => [
    //                     {
    //                         name: 'collection-share-modal-add-block',
    //                         modifier: 'undo',
    //                     },
    //                 ],
    //             }),
    //         ],
    //     }),
    // ),
    'login-on-follow-button-click': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'annotated-list-with-user',
            startRoute: {
                route: 'collectionDetails',
                params: { id: 'default-list' },
            },
            steps: [
                step({
                    name: 'follow-btn-clicked',
                    target: 'CollectionDetailsPage',
                    eventName: 'clickFollowBtn',
                    eventArgs: {},
                }),
            ],
        }),
    ),
    'profile-popup-block-loading': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'annotated-list-with-user',
            authenticated: true,
            startRoute: {
                route: 'collectionDetails',
                params: { id: 'default-list' },
            },
            setup: {
                callModifications: ({ storage }) => [
                    callModification({
                        name: 'public-profile-loading',
                        object: storage.serverModules.users,
                        property: 'getUserPublicProfile',
                        modifier: 'block',
                    }),
                ],
            },
            steps: [
                step({
                    name: 'profile-loaded',
                    callModifications: ({ storage }) => [
                        {
                            name: 'public-profile-loading',
                            modifier: 'undo',
                        },
                    ],
                }),
            ],
        }),
    ),
    'profile-popup-load-error': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'annotated-list-with-user',
            authenticated: true,
            startRoute: {
                route: 'collectionDetails',
                params: { id: 'default-list' },
            },
            setup: {
                callModifications: ({ storage }) => [
                    callModification({
                        name: 'public-profile-loading',
                        object: storage.serverModules.users,
                        property: 'getUserPublicProfile',
                        modifier: 'sabotage',
                    }),
                ],
            },
            steps: [
                step({
                    name: 'profile-loaded',
                    callModifications: ({ storage }) => [
                        {
                            name: 'public-profile-loading',
                            modifier: 'undo',
                        },
                    ],
                }),
            ],
        }),
    ),
    'web-monetization-load-error': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'annotated-list-with-user-and-follows',
            authenticated: true,
            startRoute: {
                route: 'collectionDetails',
                params: { id: 'default-list' },
            },
            setup: {
                callModifications: ({ storage }) => [
                    callModification({
                        name: 'profile-error',
                        object: storage.serverModules.users,
                        property: 'getUserPublicProfile',
                        modifier: 'sabotage',
                    }),
                ],
            },
            steps: [],
        }),
    ),
    'web-monetization-make-payment': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'annotated-list-with-user-and-follows',
            authenticated: true,
            startRoute: {
                route: 'collectionDetails',
                params: { id: 'default-list' },
            },
            steps: [
                // step({
                //     name: 'follow-btn-clicked',
                //     target: 'CollectionDetailsPage',
                //     eventName: 'clickFollowBtn',
                //     eventArgs: null,
                // })
            ],
        }),
    ),
    'add-page-extension-onboarding': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'annotated-list-with-user',
            authenticated: true,
            startRoute: {
                route: 'collectionDetails',
                params: { id: 'default-list' },
            },
            steps: [
                step({
                    name: 'show-install-ext-modal',
                    target: 'CollectionDetailsPage',
                    eventName: 'toggleInstallExtModal',
                    eventArgs: {},
                }),
            ],
        }),
    ),
    collaborating: scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user-and-follows',
        startRoute: {
            route: 'collectionDetails',
            params: { id: 'default-list' },
        },
        setup: {
            execute: async ({ services }) => {
                await services.auth.loginWithEmailPassword({
                    email: 'default-user',
                    password: 'testing',
                })
                const { link } = await services.listKeys.generateKeyLink({
                    key: { roleID: SharedListRoleID.AddOnly },
                    listReference: {
                        type: 'shared-list-reference',
                        id: 'default-list',
                    },
                })
                const keyString = getKeyStringFromLink(link)
                await services.auth.logout()
                await services.auth.loginWithEmailPassword({
                    email: 'two@test.com',
                    password: 'testing',
                })
                services.router.getQueryParam = () => {
                    return keyString
                }
                await services.listKeys.processCurrentKey()
                services.router.getQueryParam = () => {
                    return null
                }
            },
            callModifications: ({ storage, services }) => [
                callModification({
                    name: 'roles-loading',
                    object: storage.serverModules.contentSharing,
                    property: 'getListRoles',
                    modifier: 'block',
                }),
            ],
        },
        steps: [
            step({
                name: 'roles-loaded',
                callModifications: () => [
                    {
                        name: 'roles-loading',
                        modifier: 'undo',
                    },
                ],
            }),
        ],
    })),
    'discord-list': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'discord-list-with-user',
        startRoute: {
            route: 'collectionDetails',
            params: { id: 'default-discord-list' },
        },
        steps: [],
    })),
    'slack-list': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'slack-list-with-user',
        startRoute: {
            route: 'collectionDetails',
            params: { id: 'default-slack-list' },
        },
        steps: [],
    })),
    'permission-key-accepted': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'annotated-list-with-user-and-follows',
            startRoute: {
                route: 'collectionDetails',
                params: { id: 'default-list' },
            },
            setup: {
                execute: async ({ services }) => {
                    await services.auth.loginWithEmailPassword({
                        email: 'default-user',
                        password: 'testing',
                    })
                    const { link } = await services.listKeys.generateKeyLink({
                        key: { roleID: SharedListRoleID.AddOnly },
                        listReference: {
                            type: 'shared-list-reference',
                            id: 'default-list',
                        },
                    })
                    const keyString = getKeyStringFromLink(link)
                    await services.auth.logout()
                    await services.auth.loginWithEmailPassword({
                        email: 'two@test.com',
                        password: 'testing',
                    })
                    services.router.getQueryParam = () => {
                        return keyString
                    }
                },
                callModifications: ({ services }) => [
                    callModification({
                        name: 'key-processing',
                        object: services.listKeys,
                        property: 'processCurrentKey',
                        modifier: 'block',
                    }),
                ],
            },
            steps: [
                step({
                    name: 'key-processed',
                    callModifications: () => [
                        {
                            name: 'key-processing',
                            modifier: 'undo',
                        },
                    ],
                }),
            ],
        }),
    ),
    'permission-key-unauthenticated': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'annotated-list-with-user-and-follows',
            startRoute: {
                route: 'collectionDetails',
                params: { id: 'default-list' },
            },
            setup: {
                execute: async ({ services }) => {
                    await services.auth.loginWithEmailPassword({
                        email: 'default-user',
                        password: 'testing',
                    })
                    const { link } = await services.listKeys.generateKeyLink({
                        key: { roleID: SharedListRoleID.AddOnly },
                        listReference: {
                            type: 'shared-list-reference',
                            id: 'default-list',
                        },
                    })
                    const keyString = getKeyStringFromLink(link)
                    await services.auth.logout()
                    services.router.getQueryParam = () => {
                        return keyString
                    }
                },
            },
            steps: [],
        }),
    ),
    'permission-key-denied': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'annotated-list-with-user-and-follows',
            startRoute: {
                route: 'collectionDetails',
                params: { id: 'default-list' },
            },
            setup: {
                execute: async ({ services }) => {
                    await services.auth.loginWithEmailPassword({
                        email: 'two@test.com',
                        password: 'testing',
                    })
                    services.router.getQueryParam = () => 'invalid-key'
                },
            },
            steps: [],
        }),
    ),
    'permission-key-error': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user-and-follows',
        authenticated: true,
        startRoute: {
            route: 'collectionDetails',
            params: { id: 'default-list' },
        },
        setup: {
            callModifications: ({ services }) => [
                callModification({
                    name: 'process-key-error',
                    object: services.listKeys,
                    property: 'processCurrentKey',
                    modifier: 'sabotage',
                }),
            ],
        },
        steps: [],
    })),
    'private-space-denied-unauthenticated': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'annotated-list-with-user-and-follows',
            startRoute: {
                route: 'collectionDetails',
                params: { id: 'default-list' },
            },
            setup: {
                execute: async ({ storage }) => {
                    await storage.serverStorageManager.operation(
                        'updateObjects',
                        'sharedList',
                        { id: 'default-list' },
                        { private: true },
                    )
                },
            },
            steps: [],
        }),
    ),
    'private-space-denied-unauthenticated-with-key': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'annotated-list-with-user-and-follows',
            startRoute: {
                route: 'collectionDetails',
                params: { id: 'default-list' },
            },
            setup: {
                execute: async ({ storage, services }) => {
                    await storage.serverStorageManager.operation(
                        'updateObjects',
                        'sharedList',
                        { id: 'default-list' },
                        { private: true },
                    )
                    const { link } = await services.listKeys.generateKeyLink({
                        key: { roleID: SharedListRoleID.AddOnly },
                        listReference: {
                            type: 'shared-list-reference',
                            id: 'default-list',
                        },
                    })
                    const keyString = getKeyStringFromLink(link)
                    services.router.getQueryParam = () => {
                        return keyString
                    }
                },
            },
            steps: [],
        }),
    ),
    'private-space-denied-authenticated': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'annotated-list-with-user-and-follows',
            startRoute: {
                route: 'collectionDetails',
                params: { id: 'default-list' },
            },
            setup: {
                execute: async ({ storage, services }) => {
                    await services.auth.loginWithEmailPassword({
                        email: 'two@test.com',
                        password: 'wqrdwqdfw',
                    })
                    await storage.serverStorageManager.operation(
                        'updateObjects',
                        'sharedList',
                        { id: 'default-list' },
                        { private: true },
                    )
                },
            },
            steps: [],
        }),
    ),
    'private-space-denied-authenticated-with-key': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'annotated-list-with-user-and-follows',
            startRoute: {
                route: 'collectionDetails',
                params: { id: 'default-list' },
            },
            setup: {
                execute: async ({ storage, services }) => {
                    await services.auth.loginWithEmailPassword({
                        email: 'two@test.com',
                        password: 'wqrdwqdfw',
                    })
                    await storage.serverStorageManager.operation(
                        'updateObjects',
                        'sharedList',
                        { id: 'default-list' },
                        { private: true },
                    )
                    const { link } = await services.listKeys.generateKeyLink({
                        key: { roleID: SharedListRoleID.AddOnly },
                        listReference: {
                            type: 'shared-list-reference',
                            id: 'default-list',
                        },
                    })
                    const keyString = getKeyStringFromLink(link)
                    services.router.getQueryParam = () => {
                        return keyString
                    }
                },
            },
            steps: [],
        }),
    ),
    cocurated: scenario<Targets>(({ step, callModification }) => ({
        fixture: 'cocurated-list',
        startRoute: {
            route: 'collectionDetails',
            params: { id: 'cocurated-list' },
        },
        setup: {},
        steps: [
            step({
                name: 'first-annotations-toggle',
                target: 'CollectionDetailsPage',
                eventName: 'togglePageAnnotations',
                eventArgs: {
                    normalizedUrl: 'notion.so',
                },
            }),
            step({
                name: 'second-annotations-toggle',
                target: 'CollectionDetailsPage',
                eventName: 'togglePageAnnotations',
                eventArgs: {
                    normalizedUrl: 'getmemex.com',
                },
            }),
        ],
    })),
    'cocurated-with-collaborators': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'cocurated-list',
            startRoute: {
                route: 'collectionDetails',
                params: { id: 'cocurated-list' },
            },
            setup: {
                execute: async ({ storage, services }) => {
                    await services.auth.loginWithEmailPassword({
                        email: 'default-user',
                        password: '123',
                    })
                    await storage.serverModules.contentSharing.createListRole({
                        listReference: {
                            type: 'shared-list-reference',
                            id: 'cocurated-list',
                        },
                        userReference: {
                            type: 'user-reference',
                            id: 'second-user',
                        },
                        roleID: SharedListRoleID.AddOnly,
                    })
                    await storage.serverModules.contentSharing.createListRole({
                        listReference: {
                            type: 'shared-list-reference',
                            id: 'cocurated-list',
                        },
                        userReference: {
                            type: 'user-reference',
                            id: 'third-user',
                        },
                        roleID: SharedListRoleID.AddOnly,
                    })
                },
            },
            steps: [],
        }),
    ),
    'switch-lists': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'cocurated-list',
        authenticated: true,
        startRoute: {
            route: 'collectionDetails',
            params: { id: 'cocurated-list' },
        },
        setup: {},
        steps: [
            step({
                name: 'switch-lists',
                execute: async ({ services }) => {
                    services.router.goTo('collectionDetails', {
                        id: 'default-list',
                    })
                },
            }),
        ],
    })),
}
