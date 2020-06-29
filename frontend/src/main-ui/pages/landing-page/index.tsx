import React from "react";
import styled from "styled-components";
import { UIElement, UIElementServices } from "../../classes";
import Logic, { LandingPageState } from "./logic";
import { LandingPageEvent } from "./types";

const StyledFoo = styled.div`
  background-color: ${(props) => props.theme.colors.warning};
`;

interface LandingPageProps {
  services: UIElementServices<"auth">;
}

export default class LandingPage extends UIElement<
  LandingPageProps,
  LandingPageState,
  LandingPageEvent
> {
  constructor(props: LandingPageProps) {
    super(props, { logic: new Logic() });
  }

  render() {
    const breakPoints = this.getStyleBreakpoints({
      small: 160,
      medium: 640,
      large: 860,
    });

    return (
      <StyledFoo onClick={() => this.processEvent("toggle", {})}>
        foo: {this.state.foo ? "true" : "false"}
        <br />
        {/* breakPoints: {JSON.stringify(breakPoints)} */}
      </StyledFoo>
    );
  }
}
