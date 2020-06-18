import { ScenarioMap, Scenario } from "../../../services/scenarios/types";

const scenario = (options: Omit<Scenario, 'startRoute'>): Scenario => ({
    startRoute: { route: 'userHome' },
    ...options,
})

const SCENARIOS: ScenarioMap = {
    'authenticated-follower': scenario({
        fixture: 'default-project-with-user-follow',
        authenticated: true,
        steps: [
        ]
    }),
    'authenticated-publisher': scenario({
        fixture: 'no-project-with-publisher',
        authenticated: true,
        steps: [
        ]
    })
}

export default SCENARIOS
