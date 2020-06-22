import { ScenarioMap, Scenario } from "../../../services/scenarios/types";

const scenario = (options: Omit<Scenario, 'startRoute'>): Scenario => ({
    startRoute: { route: 'landingPage' },
    ...options,
})

const SCENARIOS: ScenarioMap = {
    'default': scenario({
        steps: []
    }),
}

export default SCENARIOS
