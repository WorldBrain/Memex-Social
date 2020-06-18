import { ScenarioMap, ScenarioStep, Scenario } from "../../../services/scenarios/types";

const clickEmailLogin = (name: string): ScenarioStep => ({
    name,
    target: 'AuthButtonBox',
    event: { type: 'startEmailLogin' }
})
const clickProviderLogin = (name: string): ScenarioStep => ({
    name,
    target: 'AuthButtonBox',
    event: { type: 'providerLogin', provider: 'facebook' },
})
const changeEmail = (name: string, value: string): ScenarioStep => ({
    name,
    target: 'AuthButtonBox',
    event: { type: 'emailChange', value }
})
const scenario = (options: Omit<Scenario, 'startRoute'>): Scenario => ({
    startRoute: { route: 'landingPage' },
    ...options,
    // fixture: 'default-project',
})

const SCENARIOS: ScenarioMap = {
    'default': scenario({
        steps: []
    }),
    'new-user-login': scenario({
        steps: [
            clickProviderLogin('clicked-provider-login'),
        ],
    }),
    'existing-user-login': scenario({
        fixture: 'default-project-with-user-follow',
        steps: [
            clickProviderLogin('clicked-provider-login'),
        ],
    }),
    'email-login': scenario({
        steps: [
            clickEmailLogin('clicked-email-login'),
            changeEmail('invalid-email', 'test@'),
            changeEmail('valid-email', 'test@test.com'),
        ]
    })
}

export default SCENARIOS
