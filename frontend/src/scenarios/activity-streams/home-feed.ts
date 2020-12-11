import { ScenarioMap } from "../../services/scenarios/types";
import { scenario } from "../../services/scenarios/utils";
import { HomeFeedEvent, HomeFeedSignal } from "../../features/activity-streams/ui/pages/home-feed/types";
import { setupTestActivities } from "../utils/activities";

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
    'no-activities': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        authenticated: true,
        startRoute: { route: 'homeFeed', params: {} },
        steps: []
    })),
}
