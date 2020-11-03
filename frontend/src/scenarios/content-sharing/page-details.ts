import { ScenarioMap } from "../../services/scenarios/types";
import { scenario } from "../../services/scenarios/utils";
import { PageDetailsEvent, PageDetailsSignal } from "../../features/content-sharing/ui/pages/page-details/types";
import { SharedAnnotationReference } from "@worldbrain/memex-common/lib/content-sharing/types";
import { AuthHeaderEvent, AuthHeaderSignal } from "../../features/user-management/ui/containers/auth-header/types";
import { AuthDialogEvent, AuthDialogSignal } from "../../features/user-management/ui/containers/auth-dialog/types";

type Targets = {
    PageDetailsPage: {
        events: PageDetailsEvent;
        signals: PageDetailsSignal;
    };
    AuthHeader: {
        events: AuthHeaderEvent;
        signals: AuthHeaderSignal;
    },
    AuthDialog: {
        events: AuthDialogEvent;
        signals: AuthDialogSignal;
    },
};

export const SCENARIOS: ScenarioMap<Targets> = {
    'default': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'pageDetails', params: { id: 'default-page' } },
        setup: {
            callModifications: ({ storage }) => [
                callModification({
                    name: 'page-info-loading',
                    object: storage.serverModules.contentSharing, property: 'getPageInfo',
                    modifier: 'block'
                }),
                callModification({
                    name: 'annotations-loading',
                    object: storage.serverModules.contentSharing, property: 'getAnnotationsByCreatorAndPageUrl',
                    modifier: 'block'
                }),
                callModification({
                    name: 'creator-loading',
                    object: storage.serverModules.users, property: 'getUser',
                    modifier: 'block'
                }),
            ]
        },
        steps: [
            step({
                name: 'page-info-loaded',
                callModifications: ({ storage }) => [{
                    name: 'page-info-loading',
                    modifier: 'undo',
                }]
            }),
            step({
                name: 'annotations-loaded',
                callModifications: ({ storage }) => [{
                    name: 'annotations-loading',
                    modifier: 'undo',
                }]
            }),
            step({
                name: 'creator-loaded',
                callModifications: ({ storage }) => [{
                    name: 'creator-loading',
                    modifier: 'undo',
                }]
            }),
        ]
    })),
    'user-register': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'pageDetails', params: { id: 'default-page' } },
        steps: [
            step({
                name: 'click-login',
                target: 'AuthHeader',
                eventName: 'login',
                eventArgs: null
            }),
            step({
                name: 'switch-mode',
                target: 'AuthDialog',
                eventName: 'toggleMode',
                eventArgs: null
            }),
            step({
                name: 'email',
                target: 'AuthDialog',
                eventName: 'editEmail',
                eventArgs: { value: 'john@doe.com' }
            }),
            step({
                name: 'password',
                target: 'AuthDialog',
                eventName: 'editPassword',
                eventArgs: { value: 'VeryStrongPassword' }
            }),
            step({
                name: 'confirm-credentials',
                target: 'AuthDialog',
                eventName: 'emailPasswordConfirm',
                eventArgs: null,
            }),
            step({
                name: 'display-name',
                target: 'AuthDialog',
                eventName: 'editDisplayName',
                eventArgs: { value: 'This is me!' }
            }),
            step({
                name: 'confirm-profile',
                target: 'AuthDialog',
                eventName: 'confirmDisplayName',
                eventArgs: null,
            }),
        ]
    })),
    'user-sign-in': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'pageDetails', params: { id: 'default-page' } },
        steps: [
            step({
                name: 'click-login',
                target: 'AuthHeader',
                eventName: 'login',
                eventArgs: null
            }),
            step({
                name: 'sign-in',
                target: 'AuthDialog',
                eventName: 'socialSignIn',
                eventArgs: { provider: 'github' }
            }),
        ]
    })),
    'user-sign-in-error': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'pageDetails', params: { id: 'default-page' } },
        steps: [
            step({
                name: 'click-login',
                target: 'AuthHeader',
                eventName: 'login',
                eventArgs: null
            }),
            step({
                name: 'email',
                target: 'AuthDialog',
                eventName: 'editEmail',
                eventArgs: { value: 'invalid-email' }
            }),
            step({
                name: 'email',
                target: 'AuthDialog',
                eventName: 'editPassword',
                eventArgs: { value: '12345' }
            }),
            step({
                name: 'email',
                target: 'AuthDialog',
                eventName: 'emailPasswordConfirm',
                eventArgs: null,
            }),
        ]
    })),
    'cancel-new-conversation': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'pageDetails', params: { id: 'default-page' } },
        steps: [
            step({
                name: 'initiate-reply',
                target: 'PageDetailsPage',
                eventName: 'initiateNewReplyToAnnotation',
                eventArgs: { annotationReference: { type: 'shared-annotation-reference', id: 'default-annotation' } as SharedAnnotationReference }
            }),
            step({
                name: 'edit-reply',
                target: 'PageDetailsPage',
                eventName: 'editNewReplyToAnnotation',
                eventArgs: {
                    annotationReference: { type: 'shared-annotation-reference', id: 'default-annotation' } as SharedAnnotationReference,
                    content: 'this is a new reply'
                }
            }),
            step({
                name: 'cancel-reply',
                target: 'PageDetailsPage',
                eventName: 'cancelNewReplyToAnnotation',
                eventArgs: { annotationReference: { type: 'shared-annotation-reference', id: 'default-annotation' } as SharedAnnotationReference }
            }),
            step({
                name: 'second-initiate-reply',
                target: 'PageDetailsPage',
                eventName: 'initiateNewReplyToAnnotation',
                eventArgs: { annotationReference: { type: 'shared-annotation-reference', id: 'default-annotation' } as SharedAnnotationReference }
            }),
        ]
    })),
    'unauthenticated-new-conversation': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'pageDetails', params: { id: 'default-page' } },
        steps: [
            step({
                name: 'initiate-reply',
                target: 'PageDetailsPage',
                waitForSignal: { type: 'auth-requested' },
                eventName: 'initiateNewReplyToAnnotation',
                eventArgs: { annotationReference: { type: 'shared-annotation-reference', id: 'default-annotation' } as SharedAnnotationReference },
            }),
        ]
    })),
    'confirm-new-conversation': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        authenticated: true,
        startRoute: { route: 'pageDetails', params: { id: 'default-page' } },
        steps: [
            step({
                name: 'initiate-reply',
                target: 'PageDetailsPage',
                eventName: 'initiateNewReplyToAnnotation',
                eventArgs: { annotationReference: { type: 'shared-annotation-reference', id: 'default-annotation' } as SharedAnnotationReference }
            }),
            step({
                name: 'edit-reply',
                target: 'PageDetailsPage',
                eventName: 'editNewReplyToAnnotation',
                eventArgs: {
                    annotationReference: { type: 'shared-annotation-reference', id: 'default-annotation' } as SharedAnnotationReference,
                    content: 'this is a new reply'
                }
            }),
            step({
                name: 'confirm-reply',
                target: 'PageDetailsPage',
                eventName: 'confirmNewReplyToAnnotation',
                eventArgs: { annotationReference: { type: 'shared-annotation-reference', id: 'default-annotation' } as SharedAnnotationReference }
            }),
            step({
                name: 'second-initiate-reply',
                target: 'PageDetailsPage',
                eventName: 'initiateNewReplyToAnnotation',
                eventArgs: { annotationReference: { type: 'shared-annotation-reference', id: 'default-annotation' } as SharedAnnotationReference }
            }),
        ]
    })),
    'existing-conversation': scenario<Targets>(({ step, callModification }) => ({
        authenticated: true,
        fixture: 'annotation-coversation-with-user',
        startRoute: { route: 'pageDetails', params: { id: 'default-page' } },
        steps: [
            step({
                name: 'toggle-replies',
                target: 'PageDetailsPage',
                eventName: 'toggleAnnotationReplies',
                eventArgs: {
                    annotationReference: { type: 'shared-annotation-reference', id: 'default-annotation' } as SharedAnnotationReference,
                }
            }),
            step({
                name: 'initiate-reply',
                target: 'PageDetailsPage',
                eventName: 'initiateNewReplyToAnnotation',
                eventArgs: { annotationReference: { type: 'shared-annotation-reference', id: 'default-annotation' } as SharedAnnotationReference }
            }),
            step({
                name: 'edit-reply',
                target: 'PageDetailsPage',
                eventName: 'editNewReplyToAnnotation',
                eventArgs: {
                    annotationReference: { type: 'shared-annotation-reference', id: 'default-annotation' } as SharedAnnotationReference,
                    content: 'this is a new reply'
                }
            }),
            step({
                name: 'confirm-reply',
                target: 'PageDetailsPage',
                eventName: 'confirmNewReplyToAnnotation',
                eventArgs: { annotationReference: { type: 'shared-annotation-reference', id: 'default-annotation' } as SharedAnnotationReference }
            }),
            step({
                name: 'second-initiate-reply',
                target: 'PageDetailsPage',
                eventName: 'initiateNewReplyToAnnotation',
                eventArgs: { annotationReference: { type: 'shared-annotation-reference', id: 'default-annotation' } as SharedAnnotationReference }
            }),
        ]
    })),
    'not-found': scenario<Targets>(({ step, callModification }) => ({
        startRoute: { route: 'pageDetails', params: { id: 'default-page' } },
        setup: {
        },
        steps: [
        ]
    })),
    'no-annotations': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'pageDetails', params: { id: 'empty-page' } },
        setup: {
        },
        steps: [
        ]
    })),
    'page-info-load-error': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'pageDetails', params: { id: 'default-page' } },
        setup: {
            callModifications: ({ storage }) => [
                callModification({
                    name: 'page-info-loading',
                    object: storage.serverModules.contentSharing, property: 'getPageInfo',
                    modifier: 'sabotage'
                }),
            ]
        },
        steps: [
        ]
    })),
    'creator-load-error': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'pageDetails', params: { id: 'default-page' } },
        setup: {
            callModifications: ({ storage }) => [
                callModification({
                    name: 'creator-loading',
                    object: storage.serverModules.users, property: 'getUser',
                    modifier: 'sabotage'
                }),
            ]
        },
        steps: [
        ]
    })),
    'annotations-load-error': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'pageDetails', params: { id: 'default-page' } },
        setup: {
            callModifications: ({ storage }) => [
                callModification({
                    name: 'annotations-loading',
                    object: storage.serverModules.contentSharing, property: 'getAnnotationsByCreatorAndPageUrl',
                    modifier: 'sabotage'
                }),
            ]
        },
        steps: [
        ]
    })),
}
