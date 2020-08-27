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
            if (scenario.excludeFromMetaUI) {
                return
            }

            scenario.description = scenario.description ?? scenarioName
            const stepPrograms: { [stepName: string]: (mountPoint: Element) => void } = {
                '$start': (mountPoint: Element) => {
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

            for (const step of filterScenarioSteps(scenario.steps, { untilStep: '$end' })) {
                stepPrograms[step.name] = (mountPoint: Element) => {
                    const history = createMemoryHistory()
                    mainProgram({
                        backend: 'memory', history, mountPoint,
                        navigateToScenarioStart: true,
                        queryParams: {
                            scenario: `${scenarioIdentifier.pageName}.${scenarioName}.${step.name}`
                        }
                    })
                }
            }

            scenarios.push({
                scenario,
                pageName: scenarioIdentifier.pageName,
                scenarioName,
                stepPrograms
            })
        })(scenarioPair)
    }

    runMetaUi({ history: options.history, scenarios })
}
