import { History, createMemoryHistory } from 'history'
import { ProgramQueryParams } from './types'
import runMetaUi, { MetaScenarios } from '../meta-ui'
import {
    getDefaultScenarioModules,
    findScenario,
    parseScenarioIdentifier,
    filterScenarioSteps,
    findPageScenarios,
} from '../services/scenarios'
import { Scenario } from '../services/scenarios/types'
import { mainProgram } from './main'
import { mockClipboardAPI } from '../services/clipboard/mock'
import type { _Tuple } from '@worldbrain/memex-common/lib/_workarounds/types'
import { createYoutubeServiceOptions } from '@worldbrain/memex-common/lib/services/youtube/library'
import { ImageSupportInterface } from '@worldbrain/memex-common/lib/image-support/types'

export async function metaProgram(options: {
    history: History
    queryParams: ProgramQueryParams
    imageSupport: ImageSupportInterface
}) {
    if (!options.queryParams.scenario) {
        throw new Error(`Requested meta UI without specifying scenario`)
    }

    const scenarios: MetaScenarios = []

    const scenarioIdentifier = parseScenarioIdentifier(
        options.queryParams.scenario,
    )
    const scenarioModules = getDefaultScenarioModules()

    const pageScenarios: Array<
        _Tuple<string, Scenario>
    > = scenarioIdentifier.scenarioName
        ? [
              [
                  scenarioIdentifier.scenarioName,
                  findScenario(scenarioModules, scenarioIdentifier).scenario,
              ],
          ]
        : Object.entries(findPageScenarios(scenarioModules, scenarioIdentifier))

    for (const scenarioPair of pageScenarios) {
        ;(([scenarioName, scenario]) => {
            if (scenario.excludeFromMetaUI) {
                return
            }

            scenario.description = scenario.description ?? scenarioName
            const stepPrograms: {
                [stepName: string]: (mountPoint: Element) => void
            } = {
                $start: (mountPoint: Element) => {
                    const history = createMemoryHistory()
                    mainProgram({
                        backend: 'memory',
                        history,
                        mountPoint,
                        clipboard: mockClipboardAPI,
                        navigateToScenarioStart: true,
                        queryParams: {
                            scenario: `${scenarioIdentifier.pageName}.${scenarioName}.$start`,
                        },
                        youtubeOptions: createYoutubeServiceOptions(),
                        imageSupport: options.imageSupport,
                    })
                },
            }

            for (const step of filterScenarioSteps(scenario.steps, {
                untilStep: '$end',
            })) {
                stepPrograms[step.name] = (mountPoint: Element) => {
                    const history = createMemoryHistory()
                    mainProgram({
                        backend: 'memory',
                        history,
                        mountPoint,
                        clipboard: mockClipboardAPI,
                        navigateToScenarioStart: true,
                        queryParams: {
                            scenario: `${scenarioIdentifier.pageName}.${scenarioName}.${step.name}`,
                        },
                        youtubeOptions: createYoutubeServiceOptions(),
                        imageSupport: options.imageSupport,
                    })
                }
            }

            scenarios.push({
                scenario,
                pageName: scenarioIdentifier.pageName,
                scenarioName,
                stepPrograms,
            })
        })(scenarioPair)
    }

    runMetaUi({
        history: options.history,
        scenarios,
        screenSize: options.queryParams.metaScreenSize ?? 'small',
    })
}
