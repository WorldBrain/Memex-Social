import { ScenarioMap } from "../services/scenarios/types";
import { scenario } from "../services/scenarios/utils";
import { AnnotationDetailsEvent, AnnotationDetailsSignal } from "../features/content-sharing/ui/pages/annotation-details/types";
import { NotificationCenterEvent, NotificationCenterSignal } from "../features/notifications/ui/pages/notification-center/types";

type Targets = {
    NotificationCenterPage: {
        events: NotificationCenterEvent;
        signals: NotificationCenterSignal;
    };
};

export const SCENARIOS: ScenarioMap<Targets> = {
    'default': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'notificationCenter', params: {} },
        setup: {
            execute: async ({ services, storage }) => {
                await services.auth.loginWithEmailPassword({
                    email: 'default-user',
                    password: 'bling'
                })
                await services.activityStreams.followEntity({
                    entityType: 'annotation',
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
                    reply: { content: 'Test reply' }
                })
                await services.auth.logout()

                await services.auth.loginWithEmailPassword({
                    email: 'default-user',
                    password: 'bling'
                })
            }
        },
        steps: [
        ]
    })),
}
