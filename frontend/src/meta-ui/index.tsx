import * as history from "history";
import React from "react";
import ReactDOM from "react-dom";
import styled, { ThemeProvider } from "styled-components";
import { theme } from "../main-ui/styles/theme";

export type MetaScenarios = Array<{
  description: string;
  steps: Array<{
    run: (element: Element) => void;
    description?: string;
  }>;
}>;

// import { Services } from '../services/types';
// import { Storage } from '../storage/types';

const ScenarioTitle = styled.h1`
  margin: 20px;
  font-family: ${(props) => props.theme.fonts.primary};
`;

const StepsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const StepContainer = styled.div`
  margin: 20px;
`;

const StepTitle = styled.div`
  font-family: ${(props) => props.theme.fonts.primary}
  margin-bottom: 10px;
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
          <ScenarioTitle>{scenario.description}</ScenarioTitle>
          <StepsContainer key={scenarioIndex}>
            {scenario.steps.map((step, stepIndex) => (
              <StepContainer key={stepIndex}>
                <StepTitle>{step.description || <span>&nbsp;</span>}</StepTitle>
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
