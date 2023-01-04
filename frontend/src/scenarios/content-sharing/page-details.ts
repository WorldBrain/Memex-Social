import { ScenarioMap } from '../../services/scenarios/types'
import { scenario } from '../../services/scenarios/utils'
import {
    PageDetailsEvent,
    PageDetailsSignal,
} from '../../features/content-sharing/ui/pages/page-details/types'
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
                eventArgs: 'This is me!',
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
