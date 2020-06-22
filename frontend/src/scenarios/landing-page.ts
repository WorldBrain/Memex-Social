import { ScenarioMap, Scenario } from "../services/scenarios/types";

const scenario = (options: Omit<Scenario, 'startRoute'>): Scenario => ({
    startRoute: { route: 'landingPage' },
    ...options,
})

export const SCENARIOS: ScenarioMap = {
    'default': scenario({
        steps: [
            { name: 'first-toggle', target: 'LandingPage', eventName: 'toggle', eventArgs: {} },
            { name: 'second-toggle', target: 'LandingPage', eventName: 'toggle', eventArgs: {} },
        ]
    }),
}
