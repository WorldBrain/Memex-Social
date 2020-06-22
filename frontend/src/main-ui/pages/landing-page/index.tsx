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
      <div onClick={() => this.processEvent("toggle", {})}>
        foo: {this.state.foo ? "true" : "false"}
        <br />
        breakPoints: {JSON.stringify(breakPoints)}
      </div>
    );
  }
}
