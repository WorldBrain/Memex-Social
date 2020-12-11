import React from "react";
import styled from "styled-components";
import { UIElement } from "../../../../../main-ui/classes";
import Logic from "./logic";
import {
  UnseenActivityIndicatorEvent,
  UnseenActivityIndicatorDependencies,
  UnseenActivityIndicatorState,
} from "./types";

export type UnseenActivityIndicatorFeedState =
  | "unknown"
  | "not-authenticated"
  | "has-unseen"
  | "no-unseen";

export interface UnseenActivityIndicatorProps
  extends UnseenActivityIndicatorDependencies {
  renderContent(feedState: UnseenActivityIndicatorFeedState): React.ReactNode;
}

export default class UnseenActivityIndicator extends UIElement<
  UnseenActivityIndicatorProps,
  UnseenActivityIndicatorState,
  UnseenActivityIndicatorEvent
> {
  constructor(props: UnseenActivityIndicatorProps) {
    super(props, { logic: new Logic(props) });
  }

  render() {
    return this.props.renderContent(getFeedState(this.state)) ?? null;
  }
}

export function getFeedState(
  state: Pick<UnseenActivityIndicatorState, "isAuthenticated" | "hasUnseen">
): UnseenActivityIndicatorFeedState {
  if (state.isAuthenticated === undefined) {
    return "unknown";
  }
  if (!state.isAuthenticated) {
    return "not-authenticated";
  }
  if (state.hasUnseen === undefined) {
    return "unknown";
  }
  return state.hasUnseen ? "has-unseen" : "no-unseen";
}
