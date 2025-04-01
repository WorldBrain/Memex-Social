import * as history from 'history'
import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import styled, { ThemeProvider } from 'styled-components'
import { theme } from '../main-ui/styles/theme'
import { Margin } from 'styled-components-spacing'
import Routes from '../services/router/routes'
import ROUTES, { RouteName } from '../routes'
import { Scenario } from '../services/scenarios/types'
import { MetaScreenSize } from '../setup/types'
import { stringifyScenarioIdentifier } from '../services/scenarios'

export type MetaScenarios = Array<MetaScenario>

const PROGRAM_CONTAINER_SIZES: {
    [Size in MetaScreenSize]: { width: string; height: string }
} = {
    small: { width: '360px', height: '640px' },
    large: { width: '90vw', height: '800px' },
}
export interface MetaScenario {
    scenario: Scenario
    pageName: string
    scenarioName: string
    stepPrograms: {
        [name: string]: (element: Element) => void
    }
}

const MainContainer = styled.div`
    background: white;
`

const ActionBar = styled.div`
    display: flex;
`

const ScreenSizeToggle = styled.div`
    cursor: pointer;
`

const ScenarioTitle = styled.a`
    margin: 100px 0 0 30px;
    font-size: 30px;
    font-weight: bold;
    font-family: ${(props) => props.theme.fonts.primary};
`

const StepsContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
`

const StepContainer = styled.div`
    margin: 20px;
`

const StepTitle = styled.a`
    font-family: ${(props) => props.theme.fonts.primary};
`

const ProgramContainer = styled.div<{ size: MetaScreenSize }>`
    position: relative;
    border: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0px 1px 5px rgba(0, 0, 0, 0.2);
    border-radius: 5px;
    overflow-y: auto;
    transform: translateZ(0);
    width: ${({ size }) => PROGRAM_CONTAINER_SIZES[size].width};
    height: ${({ size }) => PROGRAM_CONTAINER_SIZES[size].height};
`

const ClickToLoad = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: space-around;
    align-items: center;
    cursor: pointer;
`

interface MetaUIOptions {
    history: history.History
    scenarios: MetaScenarios
    screenSize: MetaScreenSize
}

export default function runMetaUi(options: MetaUIOptions) {
    ReactDOM.render(
        <React.StrictMode>
            <MetaUI options={options} />
        </React.StrictMode>,
        document.getElementById('root'),
    )
}

function MetaUI({ options }: { options: MetaUIOptions }) {
    const [shownScenarios, setShownScenarios] = useState<{
        [scenarioIdentifier: string]: boolean
    }>({})
    const [screenSize, setScreenSize] = useState(options.screenSize)

    const routes = new Routes({
        routes: ROUTES,
        isAuthenticated: () => false,
    })
    const getScenarioUrl = (options: {
        metaScenario: MetaScenario
        stepName?: string
    }) => {
        let url =
            routes.getUrl(
                options.metaScenario.scenario.startRoute.route as RouteName,
                options.metaScenario.scenario.startRoute.params,
            ) +
            `?scenario=${options.metaScenario.pageName}.${options.metaScenario.scenarioName}`
        if (options.stepName) {
            url = `${url}.${options.stepName}`
        }
        const { query } = options.metaScenario.scenario.startRoute
        for (const [key, value] of Object.entries(query ?? {})) {
            url += `&${key}=${encodeURIComponent(value)}`
        }
        return url
    }
    const getScenarioMetaUrl = (options: {
        metaScenario: MetaScenario
        stepName?: string
    }) => {
        let url = `/?meta=true&scenario=${options.metaScenario.pageName}.${options.metaScenario.scenarioName}`
        if (options.stepName) {
            url = `${url}.${options.stepName}`
        }
        return url
    }

    const iterateSteps = (scenario: Scenario) => {
        const steps: Array<{
            name: string
            description?: string
        }> = [{ name: '$start', description: 'Start' }, ...scenario.steps]
        return steps
    }

    return (
        <MainContainer>
            <ThemeProvider theme={theme}>
                <Margin bottom="largest">
                    <ActionBar>
                        <ScreenSizeToggle
                            onClick={() => {
                                setScreenSize(
                                    screenSize === 'small' ? 'large' : 'small',
                                )
                            }}
                        >
                            Screen size: {screenSize}
                        </ScreenSizeToggle>
                    </ActionBar>
                </Margin>
                {options.scenarios.map((metaScenario, scenarioIndex) => (
                    <React.Fragment
                        key={`${metaScenario.pageName}.${metaScenario.scenarioName}`}
                    >
                        <ScenarioTitle
                            href={getScenarioUrl({ metaScenario })}
                            target="_blank"
                        >
                            {metaScenario.scenario.description}
                        </ScenarioTitle>
                        (<a href={getScenarioMetaUrl({ metaScenario })}>meta</a>
                        )
                        <StepsContainer key={scenarioIndex}>
                            {iterateSteps(metaScenario.scenario).map(
                                (step, stepIndex) => {
                                    const scenarioIdentifier = stringifyScenarioIdentifier(
                                        {
                                            pageName: metaScenario.pageName,
                                            scenarioName:
                                                metaScenario.scenarioName,
                                            stepName: step.name,
                                        },
                                    )
                                    const isShown =
                                        options.scenarios.length === 1 ||
                                        shownScenarios[scenarioIdentifier]
                                    return (
                                        <StepContainer key={stepIndex}>
                                            <Margin bottom="small">
                                                <StepTitle
                                                    href={getScenarioUrl({
                                                        metaScenario,
                                                        stepName: step.name,
                                                    })}
                                                    target="_blank"
                                                >
                                                    {step.description ||
                                                        step.name}
                                                </StepTitle>
                                            </Margin>
                                            {isShown && (
                                                <ProgramContainer
                                                    size={screenSize}
                                                    ref={(
                                                        element: HTMLDivElement,
                                                    ) => {
                                                        if (!element) {
                                                            return
                                                        }
                                                        metaScenario.stepPrograms[
                                                            step.name
                                                        ](
                                                            element as HTMLDivElement,
                                                        )
                                                    }}
                                                />
                                            )}
                                            {!isShown && (
                                                <ProgramContainer
                                                    size={screenSize}
                                                >
                                                    <ClickToLoad
                                                        onClick={() => {
                                                            setShownScenarios({
                                                                ...shownScenarios,
                                                                [scenarioIdentifier]: true,
                                                            })
                                                        }}
                                                    >
                                                        Click to load scenario
                                                        step
                                                    </ClickToLoad>
                                                </ProgramContainer>
                                            )}
                                        </StepContainer>
                                    )
                                },
                            )}
                        </StepsContainer>
                    </React.Fragment>
                ))}
            </ThemeProvider>
        </MainContainer>
    )
}
