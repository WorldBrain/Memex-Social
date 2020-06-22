import React from "react";
import { UIElement, UIElementServices } from "../../classes";
import Logic, { LandingPageState, LandingPageEvent } from "./logic";

interface LandingPageProps {
  services: UIElementServices<"auth">;
}

export default class LandingPage extends UIElement<
  LandingPageProps,
  LandingPageState,
  LandingPageEvent
> {
  styleBreakpoints = {
    large: 860,
  };

  constructor(props: LandingPageProps) {
    super(props, { logic: new Logic() });
  }

  render() {
    return (
      <div onClick={() => this.processEvent("toggle", {})}>
        foo: {this.state.foo ? "true" : "false"}
      </div>
    );
  }
}
