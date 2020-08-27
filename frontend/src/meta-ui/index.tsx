import * as history from "history";
import React from "react";
import ReactDOM from "react-dom";
import styled, { ThemeProvider } from "styled-components";
import { theme } from "../main-ui/styles/theme";
import { Margin } from "styled-components-spacing";
import Routes from "../services/router/routes";
import ROUTES, { RouteName } from "../routes";
import { Scenario } from "../services/scenarios/types";

export type MetaScenarios = Array<MetaScenario>;
export interface MetaScenario {
  scenario: Scenario;
  pageName: string;
  scenarioName: string;
  stepPrograms: {
    [name: string]: (element: Element) => void;
  };
}

const ScenarioTitle = styled.a`
  margin: 100px 0 0 30px;
  font-size: 30px;
  font-weight: bold;
  font-family: ${(props) => props.theme.fonts.primary};
`;

const StepsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const StepContainer = styled.div`
  margin: 20px;
`;

const StepTitle = styled.a`
  font-family: ${(props) => props.theme.fonts.primary};
`;

const ProgramContainer = styled.div`
  position: relative;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0px 1px 5px rgba(0, 0, 0, 0.2);
  border-radius: 5px;
  overflow-y: auto;
`;

export default async function runMetaUi(options: {
  history: history.History;
  scenarios: MetaScenarios;
}) {
  const routes = new Routes({
    routes: ROUTES,
    isAuthenticated: () => false,
  });
  const getScenarioUrl = (options: {
    metaScenario: MetaScenario;
    stepName?: string;
  }) => {
    let url =
      routes.getUrl(
        options.metaScenario.scenario.startRoute.route as RouteName,
        options.metaScenario.scenario.startRoute.params
      ) +
      `?scenario=${options.metaScenario.pageName}.${options.metaScenario.scenarioName}`;
    if (options.stepName) {
      url = `${url}.${options.stepName}`;
    }
    return url;
  };

  const iterateSteps = (scenario: Scenario) => {
    const steps: Array<{
      name: string;
      description?: string;
    }> = [{ name: "$start", description: "Start" }, ...scenario.steps];
    return steps;
  };

  ReactDOM.render(
    <ThemeProvider theme={theme}>
      {options.scenarios.map((metaScenario, scenarioIndex) => (
        <>
          <ScenarioTitle
            href={getScenarioUrl({ metaScenario })}
            target="_blank"
          >
            {metaScenario.scenario.description}
          </ScenarioTitle>
          <StepsContainer key={scenarioIndex}>
            {iterateSteps(metaScenario.scenario).map((step, stepIndex) => (
              <StepContainer key={stepIndex}>
                <Margin bottom="small">
                  <StepTitle
                    href={getScenarioUrl({
                      metaScenario,
                      stepName: step.name,
                    })}
                    target="_blank"
                  >
                    {step.description || step.name}
                  </StepTitle>
                </Margin>
                <ProgramContainer
                  style={{ width: "360px", height: "640px" }}
                  ref={(element) => {
                    if (!element) {
                      throw new Error(
                        `React didn't give an element for program container`
                      );
                    }
                    metaScenario.stepPrograms[step.name](element);
                  }}
                />
              </StepContainer>
            ))}
          </StepsContainer>
        </>
      ))}
    </ThemeProvider>,
    document.getElementById("root")
  );
}
