import { History } from 'history'
import { ProgramQueryParams } from './types';
import runMetaUi from '../meta-ui';
import { getDefaultScenarioModules, findScenario, parseScenarioIdentifier, filterScenarioSteps } from '../services/scenarios';
import { mainProgram } from './main';

export async function metaProgram(options: { history: History, queryParams: ProgramQueryParams }) {
    if (!options.queryParams.scenario) {
        throw new Error(`Requested meta UI without specifying scenario`)
    }

    const scenarioIdentifier = parseScenarioIdentifier(options.queryParams.scenario)
    const scenariosModules = getDefaultScenarioModules()
    const { scenario, untilStep } = findScenario(scenariosModules, scenarioIdentifier)

    const startScenarioProgram = {
        description: 'Starting point',
        run: (mountPoint: Element) => {
            mainProgram({
                backend: 'memory', history: options.history, mountPoint,
                queryParams: {
                    scenario: `${scenarioIdentifier.pageName}.${scenarioIdentifier.scenarioName}.$start`,
                }
            })
        }
    }
    const stepScenarioPrograms = filterScenarioSteps(scenario.steps, { untilStep }).map(step => {
        return {
            description: step.description,
            run: (mountPoint: Element) => mainProgram({
                backend: 'memory', history: options.history, mountPoint,
                queryParams: {
                    scenario: `${scenarioIdentifier.pageName}.${scenarioIdentifier.scenarioName}.${step.name}`
                }
            })
        }
    })

    runMetaUi({ history: options.history, scenarioPrograms: [startScenarioProgram, ...stepScenarioPrograms] })
}
