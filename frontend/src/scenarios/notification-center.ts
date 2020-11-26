import { ScenarioMap } from "../services/scenarios/types";
import { scenario } from "../services/scenarios/utils";
import { NotificationCenterEvent, NotificationCenterSignal } from "../features/notifications/ui/pages/notification-center/types";
import { Services } from "../services/types";
import { Storage } from "../storage/types";

type Targets = {
    NotificationCenterPage: {
        events: NotificationCenterEvent;
        signals: NotificationCenterSignal;
    };
};

const setupNotifs = async ({ services, storage }: { services: Services, storage: Storage }) => {
    await services.auth.loginWithEmailPassword({
        email: 'default-user',
        password: 'bling'
    })
    await services.activityStreams.followEntity({
        entityType: 'sharedAnnotation',
        entity: { type: 'shared-annotation-reference', id: 'default-annotation' },
        feeds: { user: true, notification: true },
    })
    await services.auth.logout()

    await services.auth.loginWithEmailPassword({
        email: 'two@user.com',
        password: 'bling'
    })
    await storage.serverModules.users.updateUser({
        type: 'user-reference', id: 'two@user.com'
    }, {
        knownStatus: 'exists'
    }, { displayName: 'User two' })
    await services.contentConversations.submitReply({
        pageCreatorReference: { type: 'user-reference', id: 'default-user' },
        annotationReference: { type: 'shared-annotation-reference', id: 'default-annotation' },
        normalizedPageUrl: 'getmemex.com',
        reply: { content: 'Test reply one' }
    })
    await services.contentConversations.submitReply({
        pageCreatorReference: { type: 'user-reference', id: 'default-user' },
        annotationReference: { type: 'shared-annotation-reference', id: 'default-annotation' },
        normalizedPageUrl: 'getmemex.com',
        reply: { content: 'Test reply two' }
    })
    await services.auth.logout()

    await services.auth.loginWithEmailPassword({
        email: 'default-user',
        password: 'bling'
    })
}

export const SCENARIOS: ScenarioMap<Targets> = {
    'default': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'notificationCenter', params: {} },
        setup: {
            execute: setupNotifs,
        },
        steps: []
    })),
    'mark-as-read': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'notificationCenter', params: {} },
        setup: {
            callModifications: ({ services }) => [
                callModification({
                    name: 'marking-as-read',
                    object: services.activityStreams, property: 'markNotifications',
                    modifier: 'block'
                }),
            ],
            execute: setupNotifs,
        },
        steps: [
            step({
                name: 'mark-as-read',
                target: 'NotificationCenterPage',
                eventName: 'markAsRead',
                eventArgs: {
                    annotationReference: { type: 'shared-annotation-reference', id: 'default-annotation' },
                    replyReference: { type: 'conversation-reply-reference', id: 2 }
                },
            }),
            step({
                name: 'marked-as-read',
                callModifications: () => [{
                    name: 'marking-as-read',
                    modifier: 'undo',
                }],
            }),
        ]
    })),
}
