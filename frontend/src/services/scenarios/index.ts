import find from 'lodash/find'
import createResolvable from '@josephg/resolvable'
import { Services } from "../../services/types";
import { Scenario, ScenarioStep, ScenarioModuleMap, ScenarioReplayQueryParams } from "./types";
import FixtureService from '../fixtures';
import { GetCallModifications } from '../../utils/call-modifier';
const scenariosContext = typeof __webpack_require__ !== 'undefined'
    ? require.context('../../scenarios', true, /\.ts$/)
    // eslint-disable-next-line
    : require('require-context')(require('path').resolve(__dirname + '/../../scenarios'), true, /\.ts$/)

export function getDefaultScenarioModules() {
    const scenarios: ScenarioModuleMap = {}

    for (const path of scenariosContext.keys()) {
        const matches = /([^.]+)\.ts$/.exec(path)
        if (!matches) {
            throw new Error(`Scenarios with weird path: ${path}`)
        }
        let key = matches[1]
        if (key.startsWith('/')) {
            key = key.substr(1)
        }
        scenarios[key] = scenariosContext(path).SCENARIOS
    }

    return scenarios
}

type ScenarioIdentifier = { pageName: string, scenarioName: string, stepName: '$start' | '$end' | string }
type UntilScenarioStep = ScenarioStep | '$start' | '$end'

export class ScenarioService {
    private scenarioModules: ScenarioModuleMap
    private scenarioStarted = createResolvable()
    private startStepCompleted = createResolvable()
    private walkthroughPausePromise = createResolvable()
    private stepCompletedPromise = createResolvable()

    constructor(private options: {
        services: Pick<Services, 'logicRegistry' | 'auth'> & { fixtures: FixtureService },
        modifyCalls: (getModifications: GetCallModifications) => void
        scenarioModules?: ScenarioModuleMap
    }) {
        this.scenarioModules = options.scenarioModules || getDefaultScenarioModules()
    }

    findScenario(scenarioIdentifierString: string): Scenario {
        const scenarioIdentifier = parseScenarioIdentifier(scenarioIdentifierString)
        const { scenario } = findScenario(this.scenarioModules, scenarioIdentifier)
        return scenario
    }

    async startScenarioReplay(scenarioIdentifierString: string, options: { walkthrough: boolean }) {
        const scenarioIdentifier = parseScenarioIdentifier(scenarioIdentifierString)
        const { scenario, untilStep } = findScenario(this.scenarioModules, scenarioIdentifier)

        await this._loadScenarioFixture(scenario)
        if (scenario.authenticated) {
            await this.options.services.auth.loginWithProvider('google')
        }

        this._executeScenario(scenario, { ...options, untilStep })
        await this.scenarioStarted
    }

    async waitForStartStep() {
        return this.startStepCompleted
    }

    async stepWalkthrough() {
        const walkthroughPausePromise = this.walkthroughPausePromise
        this.walkthroughPausePromise = createResolvable()
        walkthroughPausePromise.resolve()
        await this.stepCompletedPromise
    }

    async _loadScenarioFixture(scenario: Scenario) {
        if (!scenario.fixture) {
            return
        }

        const userID = this.options.services.auth.getCurrentUserReference()?.id
        const context = { auth: { currentUser: userID } }
        if (typeof scenario.fixture === 'string') {
            await this.options.services.fixtures.loadFixture(scenario.fixture, {
                context: context
            })
        } else {
            await this.options.services.fixtures.generateAndLoadFixture(scenario.fixture)
        }
    }

    async _executeScenario(scenario: Scenario, options: { untilStep: UntilScenarioStep, walkthrough: boolean }) {
        const steps = filterScenarioSteps(scenario.steps, { untilStep: options.untilStep })

        if (scenario.setup?.callModifications) {
            this.options.modifyCalls(scenario.setup.callModifications)
        }
        this.scenarioStarted.resolve()

        const waitForSignal = scenario.setup?.waitForSignal
        if (waitForSignal) {
            await this.options.services.logicRegistry.waitForSignal(waitForSignal.target, waitForSignal.signal)
        }
        this.startStepCompleted.resolve()

        for (const step of steps) {
            if (options.walkthrough) {
                await this.walkthroughPausePromise
            }
            if ('callModifications' in step) {
                this.options.modifyCalls(step.callModifications)
            }
            await this._executeStep(step)

            const stepCompletedPromise = this.stepCompletedPromise
            this.stepCompletedPromise = createResolvable()
            stepCompletedPromise.resolve()
        }
    }

    async _executeStep(step: ScenarioStep) {
        const { logicRegistry } = this.options.services
        if ('target' in step) {
            await logicRegistry.waitForAttribute(step.target, 'initialized')
        }

        let stepPromise: Promise<void>
        if ('eventName' in step) {
            const eventPromise = logicRegistry.processEvent(step.target, step.eventName, step.eventArgs)
            stepPromise = step.waitForSignal ? logicRegistry.waitForSignal(step.target, step.waitForSignal) : eventPromise
        } else if ('callModifications' in step) {
            stepPromise = Promise.resolve()
        } else if ('auth' in step) {
            stepPromise = this.options.services.auth.loginWithProvider('facebook').then(() => { })
        } else {
            throw new Error(`Invalid scenario step: ${JSON.stringify(step)}`)
        }
        await stepPromise
    }
}

export function getReplayOptionsFromQueryParams(queryParams: ScenarioReplayQueryParams) {
    return {
        walkthrough: queryParams.walkthrough === 'true'
    }
}

export function parseScenarioIdentifier(scenarioIdentifierString: string): ScenarioIdentifier {
    let [pageName, scenarioName, stepName] = scenarioIdentifierString.split('.');
    if (!stepName) {
        stepName = '$end'
    }
    return { pageName, scenarioName, stepName }
}

export function stringifyScenarioIdentifier(scenarioIdentifier: ScenarioIdentifier): string {
    const parts = [scenarioIdentifier.pageName, scenarioIdentifier.scenarioName]
    if (scenarioIdentifier.stepName) {
        parts.push(scenarioIdentifier.stepName)
    }
    return parts.join('.')
}

export function findScenario(scenarioModules: ScenarioModuleMap, scenarioIdentifier: ScenarioIdentifier) {
    const scenarioString = stringifyScenarioIdentifier(scenarioIdentifier)

    const pageScenarios = findPageScenarios(scenarioModules, scenarioIdentifier)
    const scenario = pageScenarios[scenarioIdentifier.scenarioName]
    if (!scenario) {
        throw new Error(`No such scenario (not found in page scenarios): ${scenarioString}`);
    }

    let untilStep: UntilScenarioStep = '$end'
    if (scenarioIdentifier.stepName === '$start' || scenarioIdentifier.stepName === '$end') {
        untilStep = scenarioIdentifier.stepName
    } else {
        const maybeUntilStep = find(scenario.steps, { name: scenarioIdentifier.stepName })
        if (!maybeUntilStep) {
            throw new Error(`No such step in scenario: ${scenarioString}`)
        }
        untilStep = maybeUntilStep
    }

    return { scenario, untilStep }
}

export function findPageScenarios(scenarioModules: ScenarioModuleMap, scenarioIdentifier: Pick<ScenarioIdentifier, 'pageName'>) {
    const pageScenarios = scenarioModules[scenarioIdentifier.pageName]
    if (!pageScenarios) {
        throw new Error(`No such scenario (could not find page scenarios): ${scenarioIdentifier.pageName}`);
    }
    return pageScenarios
}

export function filterScenarioSteps(steps: ScenarioStep[], options: { untilStep: UntilScenarioStep }) {
    if (options.untilStep === '$start') {
        return []
    }
    if (options.untilStep === '$end') {
        return steps
    }

    const filteredSteps: ScenarioStep[] = []
    for (const step of steps) {
        filteredSteps.push(step)

        if (options.untilStep && step.name === options.untilStep.name) {
            break
        }
    }
    return filteredSteps
}
