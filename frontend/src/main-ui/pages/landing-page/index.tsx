import React from "react";
import { UIElement, UIElementServices } from "../../classes";
import Logic from "./logic";

interface Props {
  services: UIElementServices<"auth">;
}

export default class LandingPage extends UIElement<Props> {
  styleBreakpoints = {
    large: 860,
  };

  constructor(props: Props) {
    super(props, { logic: new Logic() });
  }

  render() {
    return <div></div>;
  }
}
