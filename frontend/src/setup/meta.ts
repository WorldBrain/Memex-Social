import { History, createMemoryHistory } from 'history'
import { ProgramQueryParams } from './types';
import runMetaUi, { MetaScenarios } from '../meta-ui';
import { getDefaultScenarioModules, findScenario, parseScenarioIdentifier, filterScenarioSteps, findPageScenarios } from '../services/scenarios';
import { Scenario } from '../services/scenarios/types';
import { mainProgram } from './main';

export async function metaProgram(options: { history: History, queryParams: ProgramQueryParams }) {
    if (!options.queryParams.scenario) {
        throw new Error(`Requested meta UI without specifying scenario`)
    }

    const scenarios: MetaScenarios = []

    const scenarioIdentifier = parseScenarioIdentifier(options.queryParams.scenario)
    const scenarioModules = getDefaultScenarioModules()

    const pageScenarios: Array<[string, Scenario]> = scenarioIdentifier.scenarioName
        ? [[scenarioIdentifier.scenarioName, findScenario(scenarioModules, scenarioIdentifier).scenario]]
        : Object.entries(findPageScenarios(scenarioModules, scenarioIdentifier))

    for (const scenarioPair of pageScenarios) {
        (([scenarioName, scenario]) => {
            const startScenarioProgram = {
                description: 'Starting point',
                run: (mountPoint: Element) => {
                    const history = createMemoryHistory()
                    mainProgram({
                        backend: 'memory', history, mountPoint,
                        navigateToScenarioStart: true,
                        queryParams: {
                            scenario: `${scenarioIdentifier.pageName}.${scenarioName}.$start`,
                        }
                    })
                }
            }
            const stepScenarioPrograms = filterScenarioSteps(scenario.steps, { untilStep: '$end' }).map(step => {
                const history = createMemoryHistory()
                return {
                    description: step.description,
                    run: (mountPoint: Element) => mainProgram({
                        backend: 'memory', history, mountPoint,
                        navigateToScenarioStart: true,
                        queryParams: {
                            scenario: `${scenarioIdentifier.pageName}.${scenarioName}.${step.name}`
                        }
                    })
                }
            })

            scenarios.push({
                description: scenarioName,
                steps: [startScenarioProgram, ...stepScenarioPrograms]
            })
        })(scenarioPair)
    }

    runMetaUi({ history: options.history, scenarios })
}
