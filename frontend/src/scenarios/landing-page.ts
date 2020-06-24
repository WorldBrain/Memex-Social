import { ScenarioMap } from "../services/scenarios/types";
import { LandingPageEvent } from "../main-ui/pages/landing-page/types";
import { scenario } from "../services/scenarios/utils";

export const SCENARIOS: ScenarioMap = {
    'default': scenario<{ LandingPage: LandingPageEvent }>(({ step }) => ({
        startRoute: { route: 'landingPage' },
        steps: [
            step({ name: 'first-toggle', target: 'LandingPage', eventName: 'toggle', eventArgs: {} }),
            step({ name: 'second-toggle', target: 'LandingPage', eventName: 'toggle', eventArgs: {} }),
        ]
    })),
}
