import { ScenarioMap } from "../../services/scenarios/types";
import { scenario } from "../../services/scenarios/utils";
import { HomeFeedEvent, HomeFeedSignal } from "../../features/activity-streams/ui/pages/home-feed/types";
import { setupTestActivities } from "../../scenario-utils/activities";

type Targets = {
    HomeFeedPage: {
        events: HomeFeedEvent;
        signals: HomeFeedSignal;
    };
};


export const SCENARIOS: ScenarioMap<Targets> = {
    'default': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'homeFeed', params: {} },
        setup: {
            execute: setupTestActivities,
        },
        steps: []
    })),
    'load-more-replies': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'homeFeed', params: {} },
        setup: {
            execute: setupTestActivities,
        },
        steps: [
            step({
                name: 'load-more-replies',
                target: 'HomeFeedPage',
                eventName: 'loadMoreReplies',
                eventArgs: {
                    groupId: 'act-5',
                    annotationReference: { type: 'shared-annotation-reference', id: 'third-annotation' }
                }
            })
        ]
    })),
    'no-activities': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        authenticated: true,
        startRoute: { route: 'homeFeed', params: {} },
        steps: []
    })),
}
