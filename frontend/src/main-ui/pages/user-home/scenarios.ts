import { ScenarioMap, Scenario } from "../../../services/scenarios/types";

const scenario = (options: Omit<Scenario, 'startRoute'>): Scenario => ({
    startRoute: { route: 'userHome' },
    ...options,
})

const SCENARIOS: ScenarioMap = {
    'authenticated-user': scenario({
        authenticated: true,
        steps: [
        ]
    }),
}

export default SCENARIOS
