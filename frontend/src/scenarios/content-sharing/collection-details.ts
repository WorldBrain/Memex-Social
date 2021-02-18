import { ScenarioMap } from '../../services/scenarios/types'
import { scenario } from '../../services/scenarios/utils'
import {
    CollectionDetailsEvent,
    CollectionDetailsSignal,
} from '../../features/content-sharing/ui/pages/collection-details/types'
import { SharedAnnotationReference } from '@worldbrain/memex-common/lib/content-sharing/types'
import { WebMonetizationEvents } from '../../features/web-monetization/service/types'

type Targets = {
    CollectionDetailsPage: {
        events: CollectionDetailsEvent
        signals: CollectionDetailsSignal
    }
    WebMonetizationIcon: {
        events: WebMonetizationEvents
    }
}

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
            waitForSignal: {
                target: 'CollectionDetailsPage',
                signal: { type: 'loading-started' },
            },
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
    annotations: scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: {
            route: 'collectionDetails',
            params: { id: 'default-list' },
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
            callModifications: ({ storage }) => [
                callModification({
                    name: 'block-entries-loading',
                    object: storage.serverModules.contentSharing,
                    property: 'getAnnotationListEntries',
                    modifier: 'block',
                }),
                callModification({
                    name: 'block-annotations-loading',
                    object: storage.serverModules.contentSharing,
                    property: 'getAnnotations',
                    modifier: 'block',
                }),
            ],
        },
        steps: [
            step({
                name: 'entries-loaded',
                callModifications: ({ storage }) => [
                    {
                        name: 'block-entries-loading',
                        modifier: 'undo',
                    },
                ],
            }),
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
    'annotations-entries-error': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'annotated-list-with-user',
            startRoute: {
                route: 'collectionDetails',
                params: { id: 'default-list' },
            },
            setup: {
                callModifications: ({ storage }) => [
                    callModification({
                        name: 'annotation-entries-loading',
                        object: storage.serverModules.contentSharing,
                        property: 'getAnnotationListEntries',
                        modifier: 'sabotage',
                    }),
                ],
            },
            steps: [],
        }),
    ),
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
                    eventArgs: { entryIndex: 10 },
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
                        } as SharedAnnotationReference,
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
                        } as SharedAnnotationReference,
                        content: 'this is a new reply',
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
                        } as SharedAnnotationReference,
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
                        } as SharedAnnotationReference,
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
                        } as SharedAnnotationReference,
                        content: 'this is a new reply',
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
                        } as SharedAnnotationReference,
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
                        } as SharedAnnotationReference,
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
                    name: 'toggle-replies',
                    target: 'CollectionDetailsPage',
                    eventName: 'toggleAnnotationReplies',
                    eventArgs: {
                        annotationReference: {
                            type: 'shared-annotation-reference',
                            id: 'default-annotation',
                        } as SharedAnnotationReference,
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
                        } as SharedAnnotationReference,
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
                        } as SharedAnnotationReference,
                        content: 'this is a new reply',
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
                        } as SharedAnnotationReference,
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
                        } as SharedAnnotationReference,
                    },
                }),
            ],
        }),
    ),
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
                eventArgs: null,
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
                eventArgs: null,
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
                    eventArgs: null,
                }),
            ],
        }),
    ),
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
                    eventArgs: null,
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
    'profile-popup-sabotage-loading': scenario<Targets>(
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
    'web-monetization-initial-load-error': scenario<Targets>(
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
            steps: [
                step({
                    name: 'profile-loaded',
                    callModifications: ({ storage }) => [
                        {
                            name: 'profile-error',
                            modifier: 'undo',
                        },
                    ],
                }),
            ],
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
}
