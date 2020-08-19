import * as history from "history";
import React from "react";
import ReactDOM from "react-dom";
import styled, { ThemeProvider } from "styled-components";
import { theme } from "../main-ui/styles/theme";
import { Margin } from "styled-components-spacing";

export type MetaScenarios = Array<{
  description: string;
  steps: Array<{
    name: string;
    description?: string;
    run: (element: Element) => void;
  }>;
}>;

const scenarioBaseUrl = "http://localhost:3000/c/default-list?scenario=content-sharing/collection-details."

// import { Services } from '../services/types';
// import { Storage } from '../storage/types';

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
  ReactDOM.render(
    <ThemeProvider theme={theme}>
      {options.scenarios.map((scenario, scenarioIndex) => (
        <>
          <ScenarioTitle href={scenarioBaseUrl + scenario.description} target='_blank'>{scenario.description}</ScenarioTitle>
          <StepsContainer key={scenarioIndex}>
            {scenario.steps.map((step, stepIndex) => (
              <StepContainer key={stepIndex}>
                <Margin bottom="small">
                  <StepTitle href={scenarioBaseUrl + scenario.description + '.' + step.name} target='_blank'>{step.description || step.name}</StepTitle>
                </Margin>
                <ProgramContainer
                  style={{ width: "360px", height: "640px" }}
                  ref={(element) => {
                    if (!element) {
                      throw new Error(
                        `React didn't give an element for program container`
                      );
                    }
                    step.run(element);
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
