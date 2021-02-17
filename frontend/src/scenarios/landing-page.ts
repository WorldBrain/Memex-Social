import { ScenarioMap } from '../services/scenarios/types'
import { LandingPageEvent } from '../main-ui/pages/landing-page/types'
import { scenario } from '../services/scenarios/utils'

type Targets = {
    LandingPage: {
        events: LandingPageEvent
    }
}

export const SCENARIOS: ScenarioMap<Targets> = {
    default: scenario<Targets>(({ step }) => ({
        startRoute: { route: 'landingPage' },
        steps: [
            step({
                name: 'first-toggle',
                target: 'LandingPage',
                eventName: 'toggle',
                eventArgs: {},
            }),
            step({
                name: 'second-toggle',
                target: 'LandingPage',
                eventName: 'toggle',
                eventArgs: {},
            }),
        ],
    })),
}
