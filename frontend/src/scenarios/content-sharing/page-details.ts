import { ScenarioMap } from '../../services/scenarios/types'
import { scenario } from '../../services/scenarios/utils'
import {
    PageDetailsEvent,
    PageDetailsSignal,
} from '../../features/content-sharing/ui/pages/page-details/types'
import { SharedAnnotationReference } from '@worldbrain/memex-common/lib/content-sharing/types'
import {
    AuthHeaderEvent,
    AuthHeaderSignal,
} from '../../features/user-management/ui/containers/auth-header/types'
import {
    AuthDialogEvent,
    AuthDialogSignal,
} from '../../features/user-management/ui/containers/auth-dialog/types'
import { setupTestActivities } from '../../scenario-utils/activities'

type Targets = {
    PageDetailsPage: {
        events: PageDetailsEvent
        signals: PageDetailsSignal
    }
    AuthHeader: {
        events: AuthHeaderEvent
        signals: AuthHeaderSignal
    }
    AuthDialog: {
        events: AuthDialogEvent
        signals: AuthDialogSignal
    }
}

export const SCENARIOS: ScenarioMap<Targets> = {
    default: scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'pageDetails', params: { id: 'default-page' } },
        setup: {
            callModifications: ({ storage }) => [
                callModification({
                    name: 'page-info-loading',
                    object: storage.serverModules.contentSharing,
                    property: 'getPageInfo',
                    modifier: 'block',
                }),
                callModification({
                    name: 'annotations-loading',
                    object: storage.serverModules.contentSharing,
                    property: 'getAnnotationsByCreatorAndPageUrl',
                    modifier: 'block',
                }),
                callModification({
                    name: 'creator-loading',
                    object: storage.serverModules.users,
                    property: 'getUser',
                    modifier: 'block',
                }),
            ],
        },
        steps: [
            step({
                name: 'page-info-loaded',
                callModifications: ({ storage }) => [
                    {
                        name: 'page-info-loading',
                        modifier: 'undo',
                    },
                ],
            }),
            step({
                name: 'annotations-loaded',
                callModifications: ({ storage }) => [
                    {
                        name: 'annotations-loading',
                        modifier: 'undo',
                    },
                ],
            }),
            step({
                name: 'creator-loaded',
                callModifications: ({ storage }) => [
                    {
                        name: 'creator-loading',
                        modifier: 'undo',
                    },
                ],
            }),
        ],
    })),
    'default-pdf-page': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: {
            route: 'pageDetails',
            params: { id: 'default-pdf-page' },
        },
        setup: {
            callModifications: ({ storage }) => [
                callModification({
                    name: 'page-info-loading',
                    object: storage.serverModules.contentSharing,
                    property: 'getPageInfo',
                    modifier: 'block',
                }),
                callModification({
                    name: 'annotations-loading',
                    object: storage.serverModules.contentSharing,
                    property: 'getAnnotationsByCreatorAndPageUrl',
                    modifier: 'block',
                }),
                callModification({
                    name: 'creator-loading',
                    object: storage.serverModules.users,
                    property: 'getUser',
                    modifier: 'block',
                }),
            ],
        },
        steps: [
            step({
                name: 'page-info-loaded',
                callModifications: ({ storage }) => [
                    {
                        name: 'page-info-loading',
                        modifier: 'undo',
                    },
                ],
            }),
            step({
                name: 'annotations-loaded',
                callModifications: ({ storage }) => [
                    {
                        name: 'annotations-loading',
                        modifier: 'undo',
                    },
                ],
            }),
            step({
                name: 'creator-loaded',
                callModifications: ({ storage }) => [
                    {
                        name: 'creator-loading',
                        modifier: 'undo',
                    },
                ],
            }),
        ],
    })),
    'default-local-pdf-page': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'annotated-list-with-user',
            startRoute: {
                route: 'pageDetails',
                params: { id: 'default-local-pdf-page' },
            },
            setup: {
                callModifications: ({ storage }) => [
                    callModification({
                        name: 'page-info-loading',
                        object: storage.serverModules.contentSharing,
                        property: 'getPageInfo',
                        modifier: 'block',
                    }),
                    callModification({
                        name: 'annotations-loading',
                        object: storage.serverModules.contentSharing,
                        property: 'getAnnotationsByCreatorAndPageUrl',
                        modifier: 'block',
                    }),
                    callModification({
                        name: 'creator-loading',
                        object: storage.serverModules.users,
                        property: 'getUser',
                        modifier: 'block',
                    }),
                ],
            },
            steps: [
                step({
                    name: 'page-info-loaded',
                    callModifications: ({ storage }) => [
                        {
                            name: 'page-info-loading',
                            modifier: 'undo',
                        },
                    ],
                }),
                step({
                    name: 'annotations-loaded',
                    callModifications: ({ storage }) => [
                        {
                            name: 'annotations-loading',
                            modifier: 'undo',
                        },
                    ],
                }),
                step({
                    name: 'creator-loaded',
                    callModifications: ({ storage }) => [
                        {
                            name: 'creator-loading',
                            modifier: 'undo',
                        },
                    ],
                }),
            ],
        }),
    ),
    'user-register': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'pageDetails', params: { id: 'default-page' } },
        setup: {
            callModifications: ({ services }) => [
                callModification({
                    name: 'register-running',
                    object: services.auth,
                    property: 'registerWithEmailPassword',
                    modifier: 'block',
                }),
                callModification({
                    name: 'refresh-running',
                    object: services.auth,
                    property: 'refreshCurrentUser',
                    modifier: 'block',
                }),
            ],
        },
        steps: [
            step({
                name: 'click-login',
                target: 'AuthHeader',
                eventName: 'login',
                eventArgs: null,
            }),
            step({
                name: 'switch-mode',
                target: 'AuthDialog',
                eventName: 'toggleMode',
                eventArgs: null,
            }),
            step({
                name: 'email',
                target: 'AuthDialog',
                eventName: 'editEmail',
                eventArgs: { value: 'john@doe.com' },
            }),
            step({
                name: 'password',
                target: 'AuthDialog',
                eventName: 'editPassword',
                eventArgs: { value: 'VeryStrongPassword' },
            }),
            step({
                name: 'confirm-credentials',
                target: 'AuthDialog',
                eventName: 'emailPasswordConfirm',
                eventArgs: null,
                waitForSignal: { type: 'auth-running' },
            }),
            step({
                name: 'register-done',
                callModifications: ({ storage }) => [
                    {
                        name: 'register-running',
                        modifier: 'undo',
                    },
                ],
            }),
            step({
                name: 'display-name',
                target: 'AuthDialog',
                eventName: 'editDisplayName',
                eventArgs: { value: 'This is me!' },
            }),
            step({
                name: 'confirm-profile',
                target: 'AuthDialog',
                eventName: 'confirmDisplayName',
                eventArgs: null,
            }),
        ],
    })),
    'user-register-profile-cancel': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'annotated-list-with-user',
            startRoute: {
                route: 'pageDetails',
                params: { id: 'default-page' },
            },
            setup: {
                callModifications: ({ services }) => [
                    callModification({
                        name: 'register-running',
                        object: services.auth,
                        property: 'registerWithEmailPassword',
                        modifier: 'block',
                    }),
                    callModification({
                        name: 'refresh-running',
                        object: services.auth,
                        property: 'refreshCurrentUser',
                        modifier: 'block',
                    }),
                ],
            },
            steps: [
                step({
                    name: 'click-login',
                    target: 'AuthHeader',
                    eventName: 'login',
                    eventArgs: null,
                }),
                step({
                    name: 'switch-mode',
                    target: 'AuthDialog',
                    eventName: 'toggleMode',
                    eventArgs: null,
                }),
                step({
                    name: 'email',
                    target: 'AuthDialog',
                    eventName: 'editEmail',
                    eventArgs: { value: 'john@doe.com' },
                }),
                step({
                    name: 'password',
                    target: 'AuthDialog',
                    eventName: 'editPassword',
                    eventArgs: { value: 'VeryStrongPassword' },
                }),
                step({
                    name: 'confirm-credentials',
                    target: 'AuthDialog',
                    eventName: 'emailPasswordConfirm',
                    eventArgs: null,
                    waitForSignal: { type: 'auth-running' },
                }),
                step({
                    name: 'register-done',
                    callModifications: ({ storage }) => [
                        {
                            name: 'register-running',
                            modifier: 'undo',
                        },
                    ],
                }),
                step({
                    name: 'profile-cancel',
                    target: 'AuthDialog',
                    eventName: 'close',
                    eventArgs: null,
                }),
            ],
        }),
    ),
    'existing-user-sign-in': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'annotated-list-with-user',
            startRoute: {
                route: 'pageDetails',
                params: { id: 'default-page' },
            },
            setup: {
                callModifications: ({ services }) => [
                    callModification({
                        name: 'login-running',
                        object: services.auth,
                        property: 'loginWithEmailPassword',
                        modifier: 'block',
                    }),
                ],
            },
            steps: [
                step({
                    name: 'click-login',
                    target: 'AuthHeader',
                    eventName: 'login',
                    eventArgs: null,
                }),
                step({
                    name: 'email',
                    target: 'AuthDialog',
                    eventName: 'editEmail',
                    eventArgs: { value: 'default-user' },
                }),
                step({
                    name: 'password',
                    target: 'AuthDialog',
                    eventName: 'editPassword',
                    eventArgs: { value: 'VeryStrongPassword' },
                }),
                step({
                    name: 'confirm-credentials',
                    target: 'AuthDialog',
                    eventName: 'emailPasswordConfirm',
                    eventArgs: null,
                }),
                step({
                    name: 'login-done',
                    callModifications: ({ storage }) => [
                        {
                            name: 'login-running',
                            modifier: 'undo',
                        },
                    ],
                }),
            ],
        }),
    ),
    'new-user-sign-in': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'pageDetails', params: { id: 'default-page' } },
        setup: {
            callModifications: ({ services }) => [
                callModification({
                    name: 'login-running',
                    object: services.auth,
                    property: 'loginWithEmailPassword',
                    modifier: 'block',
                }),
            ],
        },
        steps: [
            step({
                name: 'click-login',
                target: 'AuthHeader',
                eventName: 'login',
                eventArgs: null,
            }),
            step({
                name: 'email',
                target: 'AuthDialog',
                eventName: 'editEmail',
                eventArgs: { value: 'new-user' },
            }),
            step({
                name: 'password',
                target: 'AuthDialog',
                eventName: 'editPassword',
                eventArgs: { value: 'VeryStrongPassword' },
            }),
            step({
                name: 'confirm-credentials',
                target: 'AuthDialog',
                eventName: 'emailPasswordConfirm',
                eventArgs: null,
            }),
            step({
                name: 'login-done',
                callModifications: ({ storage }) => [
                    {
                        name: 'login-running',
                        modifier: 'undo',
                    },
                ],
            }),
        ],
    })),
    'user-sign-in-error': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'pageDetails', params: { id: 'default-page' } },
        steps: [
            step({
                name: 'click-login',
                target: 'AuthHeader',
                eventName: 'login',
                eventArgs: null,
            }),
            step({
                name: 'email',
                target: 'AuthDialog',
                eventName: 'editEmail',
                eventArgs: { value: 'invalid-email' },
            }),
            step({
                name: 'password',
                target: 'AuthDialog',
                eventName: 'editPassword',
                eventArgs: { value: '12345' },
            }),
            step({
                name: 'confirm',
                target: 'AuthDialog',
                eventName: 'emailPasswordConfirm',
                eventArgs: null,
            }),
            step({
                name: 'second-email',
                target: 'AuthDialog',
                eventName: 'editEmail',
                eventArgs: { value: 'my@email.com' },
                callModifications: ({ services }) => [
                    callModification({
                        name: 'login-error',
                        object: services.auth,
                        property: 'loginWithEmailPassword',
                        modifier: 'sabotage',
                    }),
                ],
            }),
            step({
                name: 'second-confirm',
                target: 'AuthDialog',
                eventName: 'emailPasswordConfirm',
                eventArgs: null,
            }),
        ],
    })),
    'user-sign-out': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        authenticated: true,
        startRoute: { route: 'pageDetails', params: { id: 'default-page' } },
        setup: {
            waitForSignal: {
                target: 'PageDetailsPage',
                signal: { type: 'loaded' },
            },
        },
        steps: [
            step({
                name: 'toggle-menu',
                target: 'AuthHeader',
                eventName: 'toggleMenu',
                eventArgs: null,
            }),
            step({
                name: 'click-logout',
                target: 'AuthHeader',
                eventName: 'logout',
                eventArgs: null,
            }),
        ],
    })),
    'account-settings': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        authenticated: true,
        startRoute: { route: 'pageDetails', params: { id: 'default-page' } },
        setup: {
            waitForSignal: {
                target: 'PageDetailsPage',
                signal: { type: 'loaded' },
            },
        },
        steps: [
            step({
                name: 'toggle-menu',
                target: 'AuthHeader',
                eventName: 'toggleMenu',
                eventArgs: null,
            }),
            step({
                name: 'click-settings',
                target: 'AuthHeader',
                eventName: 'showAccountSettings',
                eventArgs: null,
            }),
        ],
    })),
    // 'cancel-new-page-comment': scenario<Targets>(
    //     ({ step, callModification }) => ({
    //         fixture: 'annotated-list-with-user',
    //         authenticated: true,
    //         startRoute: {
    //             route: 'pageDetails',
    //             params: { id: 'default-page' },
    //         },
    //         steps: [
    //             step({
    //                 name: 'initiate-comment',
    //                 target: 'PageDetailsPage',
    //                 eventName: 'initiateNewReplyToPage',
    //                 eventArgs: {
    //                     pageReplyId: 'getmemex.com',
    //                 },
    //             }),
    //             step({
    //                 name: 'edit-comment',
    //                 target: 'PageDetailsPage',
    //                 eventName: 'editNewReplyToPage',
    //                 eventArgs: {
    //                     content: 'this is a new comment',
    //                     pageReplyId: 'getmemex.com',
    //                 },
    //             }),
    //             step({
    //                 name: 'cancel-comment',
    //                 target: 'PageDetailsPage',
    //                 eventName: 'cancelNewReplyToPage',
    //                 eventArgs: {
    //                     pageReplyId: 'getmemex.com',
    //                 },
    //             }),
    //             step({
    //                 name: 'second-initiate-comment',
    //                 target: 'PageDetailsPage',
    //                 eventName: 'initiateNewReplyToPage',
    //                 eventArgs: {
    //                     pageReplyId: 'getmemex.com',
    //                 },
    //             }),
    //         ],
    //     }),
    // ),
    // 'confirm-new-page-comment': scenario<Targets>(
    //     ({ step, callModification }) => ({
    //         fixture: 'annotated-list-with-user',
    //         authenticated: true,
    //         startRoute: {
    //             route: 'pageDetails',
    //             params: { id: 'default-page' },
    //         },
    //         setup: {
    //             callModifications: ({ storage }) => [
    //                 callModification({
    //                     name: 'comment-running',
    //                     object: storage.serverModules.contentConversations,
    //                     property: 'getOrCreateThread',
    //                     modifier: 'block',
    //                 }),
    //             ],
    //         },
    //         steps: [
    //             step({
    //                 name: 'initiate-comment',
    //                 target: 'PageDetailsPage',
    //                 eventName: 'initiateNewReplyToPage',
    //                 eventArgs: {
    //                     pageReplyId: 'getmemex.com',
    //                 },
    //             }),
    //             step({
    //                 name: 'edit-comment',
    //                 target: 'PageDetailsPage',
    //                 eventName: 'editNewReplyToPage',
    //                 eventArgs: {
    //                     pageReplyId: 'getmemex.com',
    //                     content: 'this is a new comment',
    //                 },
    //             }),
    //             step({
    //                 name: 'confirm-comment',
    //                 target: 'PageDetailsPage',
    //                 eventName: 'confirmNewReplyToPage',
    //                 eventArgs: {
    //                     pageReplyId: 'getmemex.com',
    //                     normalizedPageUrl: 'getmemex.com',
    //                     pageCreatorReference: {
    //                         type: 'user-reference',
    //                         id: 'default-user',
    //                     },
    //                 },
    //                 waitForSignal: { type: 'new-note-submitting' },
    //             }),
    //             step({
    //                 name: 'comment-done',
    //                 callModifications: () => [
    //                     {
    //                         name: 'comment-running',
    //                         modifier: 'undo',
    //                     },
    //                 ],
    //                 waitForStep: 'confirm-comment',
    //             }),
    //             step({
    //                 name: 'second-initiate-comment',
    //                 target: 'PageDetailsPage',
    //                 eventName: 'initiateNewReplyToPage',
    //                 eventArgs: {
    //                     pageReplyId: 'getmemex.com',
    //                 },
    //             }),
    //         ],
    //     }),
    // ),
    // 'new-page-comment-error': scenario<Targets>(
    //     ({ step, callModification }) => ({
    //         fixture: 'annotated-list-with-user',
    //         authenticated: true,
    //         startRoute: {
    //             route: 'pageDetails',
    //             params: { id: 'default-page' },
    //         },
    //         setup: {
    //             callModifications: ({ storage }) => [
    //                 callModification({
    //                     name: 'reply-broken',
    //                     object: storage.serverModules.contentConversations,
    //                     property: 'getOrCreateThread',
    //                     modifier: 'sabotage',
    //                 }),
    //             ],
    //         },
    //         steps: [
    //             step({
    //                 name: 'initiate-comment',
    //                 target: 'PageDetailsPage',
    //                 eventName: 'initiateNewReplyToPage',
    //                 eventArgs: {
    //                     pageReplyId: 'getmemex.com',
    //                 },
    //             }),
    //             step({
    //                 name: 'edit-comment',
    //                 target: 'PageDetailsPage',
    //                 eventName: 'editNewReplyToPage',
    //                 eventArgs: {
    //                     pageReplyId: 'getmemex.com',
    //                     content: 'this is a new comment',
    //                 },
    //             }),
    //             step({
    //                 name: 'confirm-comment',
    //                 target: 'PageDetailsPage',
    //                 eventName: 'confirmNewReplyToPage',
    //                 eventArgs: {
    //                     pageReplyId: 'getmemex.com',
    //                     normalizedPageUrl: 'getmemex.com',
    //                     pageCreatorReference: {
    //                         type: 'user-reference',
    //                         id: 'default-user',
    //                     },
    //                 },
    //             }),
    //         ],
    //     }),
    // ),
    'cancel-new-conversation': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'annotated-list-with-user',
            authenticated: true,
            startRoute: {
                route: 'pageDetails',
                params: { id: 'default-page' },
            },
            steps: [
                step({
                    name: 'initiate-reply',
                    target: 'PageDetailsPage',
                    eventName: 'initiateNewReplyToAnnotation',
                    eventArgs: {
                        annotationReference: {
                            type: 'shared-annotation-reference',
                            id: 'default-annotation',
                        },
                        sharedListReference: null,
                    },
                }),
                step({
                    name: 'edit-reply',
                    target: 'PageDetailsPage',
                    eventName: 'editNewReplyToAnnotation',
                    eventArgs: {
                        annotationReference: {
                            type: 'shared-annotation-reference',
                            id: 'default-annotation',
                        } as SharedAnnotationReference,
                        content: 'this is a new reply',
                        sharedListReference: null,
                    },
                }),
                step({
                    name: 'cancel-reply',
                    target: 'PageDetailsPage',
                    eventName: 'cancelNewReplyToAnnotation',
                    eventArgs: {
                        annotationReference: {
                            type: 'shared-annotation-reference',
                            id: 'default-annotation',
                        } as SharedAnnotationReference,
                        sharedListReference: null,
                    },
                }),
                step({
                    name: 'second-initiate-reply',
                    target: 'PageDetailsPage',
                    eventName: 'initiateNewReplyToAnnotation',
                    eventArgs: {
                        annotationReference: {
                            type: 'shared-annotation-reference',
                            id: 'default-annotation',
                        },
                        sharedListReference: null,
                    },
                }),
            ],
        }),
    ),
    'unauthenticated-new-conversation': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'annotated-list-with-user',
            startRoute: {
                route: 'pageDetails',
                params: { id: 'default-page' },
            },
            steps: [
                step({
                    name: 'initiate-reply',
                    target: 'PageDetailsPage',
                    waitForSignal: { type: 'auth-requested' },
                    eventName: 'initiateNewReplyToAnnotation',
                    eventArgs: {
                        annotationReference: {
                            type: 'shared-annotation-reference',
                            id: 'default-annotation',
                        },
                        sharedListReference: null,
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
                route: 'pageDetails',
                params: { id: 'default-page' },
            },
            setup: {
                callModifications: ({ storage }) => [
                    callModification({
                        name: 'reply-running',
                        object: storage.serverModules.contentConversations,
                        property: 'createReply',
                        modifier: 'block',
                    }),
                ],
            },
            steps: [
                step({
                    name: 'initiate-reply',
                    target: 'PageDetailsPage',
                    eventName: 'initiateNewReplyToAnnotation',
                    eventArgs: {
                        annotationReference: {
                            type: 'shared-annotation-reference',
                            id: 'default-annotation',
                        },
                        sharedListReference: null,
                    },
                }),
                step({
                    name: 'edit-reply',
                    target: 'PageDetailsPage',
                    eventName: 'editNewReplyToAnnotation',
                    eventArgs: {
                        annotationReference: {
                            type: 'shared-annotation-reference',
                            id: 'default-annotation',
                        } as SharedAnnotationReference,
                        content: 'this is a new reply',
                        sharedListReference: null,
                    },
                }),
                step({
                    name: 'confirm-reply',
                    target: 'PageDetailsPage',
                    eventName: 'confirmNewReplyToAnnotation',
                    eventArgs: {
                        annotationReference: {
                            type: 'shared-annotation-reference',
                            id: 'default-annotation',
                        } as SharedAnnotationReference,
                        sharedListReference: null,
                    },
                    waitForSignal: { type: 'reply-submitting' },
                }),
                step({
                    name: 'reply-done',
                    callModifications: () => [
                        {
                            name: 'reply-running',
                            modifier: 'undo',
                        },
                    ],
                    waitForStep: 'confirm-reply',
                }),
                step({
                    name: 'second-initiate-reply',
                    target: 'PageDetailsPage',
                    eventName: 'initiateNewReplyToAnnotation',
                    eventArgs: {
                        annotationReference: {
                            type: 'shared-annotation-reference',
                            id: 'default-annotation',
                        },
                        sharedListReference: null,
                    },
                }),
            ],
        }),
    ),
    'new-conversation-error': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'annotated-list-with-user',
            authenticated: true,
            startRoute: {
                route: 'pageDetails',
                params: { id: 'default-page' },
            },
            setup: {
                callModifications: ({ storage }) => [
                    callModification({
                        name: 'reply-broken',
                        object: storage.serverModules.contentConversations,
                        property: 'createReply',
                        modifier: 'sabotage',
                    }),
                ],
            },
            steps: [
                step({
                    name: 'initiate-reply',
                    target: 'PageDetailsPage',
                    eventName: 'initiateNewReplyToAnnotation',
                    eventArgs: {
                        annotationReference: {
                            type: 'shared-annotation-reference',
                            id: 'default-annotation',
                        },
                        sharedListReference: null,
                    },
                }),
                step({
                    name: 'edit-reply',
                    target: 'PageDetailsPage',
                    eventName: 'editNewReplyToAnnotation',
                    eventArgs: {
                        annotationReference: {
                            type: 'shared-annotation-reference',
                            id: 'default-annotation',
                        } as SharedAnnotationReference,
                        content: 'this is a new reply',
                        sharedListReference: null,
                    },
                }),
                step({
                    name: 'confirm-reply',
                    target: 'PageDetailsPage',
                    eventName: 'confirmNewReplyToAnnotation',
                    eventArgs: {
                        annotationReference: {
                            type: 'shared-annotation-reference',
                            id: 'default-annotation',
                        } as SharedAnnotationReference,
                        sharedListReference: null,
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
                route: 'pageDetails',
                params: { id: 'default-page' },
            },
            steps: [
                step({
                    name: 'toggle-replies',
                    target: 'PageDetailsPage',
                    eventName: 'toggleAnnotationReplies',
                    eventArgs: {
                        annotationReference: {
                            type: 'shared-annotation-reference',
                            id: 'default-annotation',
                        } as SharedAnnotationReference,
                        sharedListReference: null,
                    },
                }),
                step({
                    name: 'initiate-reply',
                    target: 'PageDetailsPage',
                    eventName: 'initiateNewReplyToAnnotation',
                    eventArgs: {
                        annotationReference: {
                            type: 'shared-annotation-reference',
                            id: 'default-annotation',
                        },
                        sharedListReference: null,
                    },
                }),
                step({
                    name: 'edit-reply',
                    target: 'PageDetailsPage',
                    eventName: 'editNewReplyToAnnotation',
                    eventArgs: {
                        annotationReference: {
                            type: 'shared-annotation-reference',
                            id: 'default-annotation',
                        } as SharedAnnotationReference,
                        content: 'this is a new reply',
                        sharedListReference: null,
                    },
                }),
                step({
                    name: 'confirm-reply',
                    target: 'PageDetailsPage',
                    eventName: 'confirmNewReplyToAnnotation',
                    eventArgs: {
                        annotationReference: {
                            type: 'shared-annotation-reference',
                            id: 'default-annotation',
                        } as SharedAnnotationReference,
                        sharedListReference: null,
                    },
                }),
                step({
                    name: 'second-initiate-reply',
                    target: 'PageDetailsPage',
                    eventName: 'initiateNewReplyToAnnotation',
                    eventArgs: {
                        annotationReference: {
                            type: 'shared-annotation-reference',
                            id: 'default-annotation',
                        },
                        sharedListReference: null,
                    },
                }),
            ],
        }),
    ),
    'not-found': scenario<Targets>(({ step, callModification }) => ({
        startRoute: { route: 'pageDetails', params: { id: 'default-page' } },
        setup: {},
        steps: [],
    })),
    'no-annotations': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'pageDetails', params: { id: 'empty-page' } },
        setup: {},
        steps: [],
    })),
    'page-info-load-error': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'pageDetails', params: { id: 'default-page' } },
        setup: {
            callModifications: ({ storage }) => [
                callModification({
                    name: 'page-info-loading',
                    object: storage.serverModules.contentSharing,
                    property: 'getPageInfo',
                    modifier: 'sabotage',
                }),
            ],
        },
        steps: [],
    })),
    'creator-load-error': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'pageDetails', params: { id: 'default-page' } },
        setup: {
            callModifications: ({ storage }) => [
                callModification({
                    name: 'creator-loading',
                    object: storage.serverModules.users,
                    property: 'getUser',
                    modifier: 'sabotage',
                }),
            ],
        },
        steps: [],
    })),
    'annotations-load-error': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'annotated-list-with-user',
            startRoute: {
                route: 'pageDetails',
                params: { id: 'default-page' },
            },
            setup: {
                callModifications: ({ storage }) => [
                    callModification({
                        name: 'annotations-loading',
                        object: storage.serverModules.contentSharing,
                        property: 'getAnnotationsByCreatorAndPageUrl',
                        modifier: 'sabotage',
                    }),
                ],
            },
            steps: [],
        }),
    ),
    'unseen-activities': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'pageDetails', params: { id: 'default-page' } },
        setup: {
            execute: setupTestActivities,
        },
        steps: [],
    })),
    'logout-login-with-unseen-activities': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'annotated-list-with-user',
            startRoute: {
                route: 'pageDetails',
                params: { id: 'default-page' },
            },
            setup: {
                execute: async (context) => {
                    await setupTestActivities(context)
                    await new Promise((resolve) => setTimeout(resolve, 500))
                },
            },
            steps: [
                step({
                    name: 'toggle-menu',
                    target: 'AuthHeader',
                    eventName: 'toggleMenu',
                    eventArgs: null,
                }),
                step({
                    name: 'click-logout',
                    target: 'AuthHeader',
                    eventName: 'logout',
                    eventArgs: null,
                }),
                step({
                    name: 'click-login',
                    target: 'AuthHeader',
                    eventName: 'login',
                    eventArgs: null,
                }),
                step({
                    name: 'email',
                    target: 'AuthDialog',
                    eventName: 'editEmail',
                    eventArgs: { value: 'default-user' },
                }),
                step({
                    name: 'password',
                    target: 'AuthDialog',
                    eventName: 'editPassword',
                    eventArgs: { value: 'VeryStrongPassword' },
                }),
                step({
                    name: 'confirm-credentials',
                    target: 'AuthDialog',
                    eventName: 'emailPasswordConfirm',
                    eventArgs: null,
                }),
            ],
        }),
    ),
}
