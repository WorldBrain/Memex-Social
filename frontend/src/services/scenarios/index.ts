import find from 'lodash/find'
import { Services } from "../../services/types";
import { Scenario, ScenarioStep, ScenarioModuleMap, ScenarioReplayQueryParams } from "./types";
import FixtureService from '../fixtures';
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
    private walkthroughResolve: () => void = () => { }
    private stepPromises: { [stepName: string]: Promise<void> } = {}
    private getNextStepPromise = Promise.resolve(Promise.resolve())

    constructor(private options: {
        services: Pick<Services, 'logicRegistry' | 'auth'> & { fixtures: FixtureService },
        scenarioModules?: ScenarioModuleMap
    }) {
        this.scenarioModules = options.scenarioModules || getDefaultScenarioModules()
    }

    async startScenarioReplay(scenarioIdentifierString: string, options: { walkthrough: boolean }) {
        const scenarioIdentifier = parseScenarioIdentifier(scenarioIdentifierString)
        const { scenario, untilStep } = findScenario(this.scenarioModules, scenarioIdentifier)

        await this._loadScenarioFixture(scenario)
        if (scenario.authenticated) {
            await this.options.services.auth.loginWithProvider('google')
        }

        this._executeScenario(scenario, { ...options, untilStep })
    }

    async stepWalkthrough() {
        const getNextStepPromise = this.getNextStepPromise
        this.walkthroughResolve()
        const stepPromise = await getNextStepPromise
        await stepPromise
    }

    async _loadScenarioFixture(scenario: Scenario) {
        if (!scenario.fixture) {
            return
        }

        const userID = this.options.services.auth.getCurrentUserReference()?.id
        await this.options.services.fixtures.loadFixture(scenario.fixture, {
            context: {
                auth: { currentUser: userID }
            }
        })
    }

    async _executeScenario(scenario: Scenario, options: { untilStep: UntilScenarioStep, walkthrough: boolean }) {
        const steps = filterScenarioSteps(scenario.steps, { untilStep: options.untilStep })
        for (const step of steps) {
            if (step.waitFor) {
                const stepPromise = this.stepPromises[step.waitFor]
                if (!stepPromise) {
                    throw new Error(`Step ${step.name} wants to wait for step that is either non-existent or doesn't have noWait: ${step.waitFor}`)
                }
                await stepPromise
            }

            let resolveNextStepPromise: (promise: Promise<void>) => void = () => { }
            this.getNextStepPromise = new Promise(resolve => {
                resolveNextStepPromise = resolve
            })
            if (options.walkthrough) {
                await new Promise(resolve => {
                    this.walkthroughResolve = resolve
                })
            }
            const stepPromise = this._executeStep(step)
            resolveNextStepPromise(stepPromise)
            await stepPromise
        }
    }

    async _waitForElement(name: string) {
        const { logicRegistry } = this.options.services
        if (!logicRegistry.isRegistered(name)) {
            await new Promise(resolve => {
                const handler = (event: { name: string }) => {
                    if (event.name === name) {
                        logicRegistry.events.off('registered', handler)
                        resolve()
                    }
                }
                logicRegistry.events.on('registered', handler)
            })
        }
        if (!logicRegistry.getAttribute(name, 'initialized')) {
            await new Promise(resolve => {
                const handler = (event: { name: string, key: string }) => {
                    if (event.name === name && event.key === 'initialized') {
                        logicRegistry.events.off('attribute.changed', handler)
                        resolve()
                    }
                }
                logicRegistry.events.on('attribute.changed', handler)
            })
        }
    }

    async _executeStep(step: ScenarioStep) {
        if ('target' in step) {
            await this._waitForElement(step.target)
        }

        let stepPromise: Promise<void>
        if ('eventName' in step) {
            stepPromise = this.options.services.logicRegistry.logicUnits[step.target].eventProcessor(step.eventName, step.eventArgs)
        } else if ('output' in step) {
            stepPromise = this.options.services.logicRegistry.logicUnits[step.target].triggerOutput(step.output.event, step.output)
        } else if ('auth' in step) {
            stepPromise = this.options.services.auth.loginWithProvider('facebook')
        } else {
            throw new Error(`Invalid scenario step: ${JSON.stringify(step)}`)
        }
        if (!step.dontWait) {
            await stepPromise
        } else {
            this.stepPromises[step.name] = stepPromise
        }
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

    const pageScenarios = scenarioModules[scenarioIdentifier.pageName]
    if (!pageScenarios) {
        throw new Error(`No such scenario (could not find page scenarios): ${scenarioString}`);
    }
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
