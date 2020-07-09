import { Trans } from "react-i18next";
import React from "react";
// import styled from "styled-components";
import { UIElement, UIElementServices } from "../../classes";
import Logic, { LandingPageState } from "./logic";
import { LandingPageEvent } from "./types";

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
    return <Trans>Landing page</Trans>;
  }
}
