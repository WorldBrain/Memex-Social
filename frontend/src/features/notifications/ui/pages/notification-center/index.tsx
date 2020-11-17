import React from "react";
import styled from "styled-components";
import { UIElement } from "../../../../../main-ui/classes";
import Logic from "./logic";
import {
  NotificationCenterEvent,
  NotificationCenterDependencies,
  NotificationCenterState,
} from "./types";
import DocumentTitle from "../../../../../main-ui/components/document-title";
import DefaultPageLayout from "../../../../../common-ui/layouts/default-page-layout";
import { relativeTimeThreshold } from "moment";
import LoadingScreen from "../../../../../common-ui/components/loading-screen";

export default class NotificationCenterPage extends UIElement<
  NotificationCenterDependencies,
  NotificationCenterState,
  NotificationCenterEvent
> {
  constructor(props: NotificationCenterDependencies) {
    super(props, { logic: new Logic(props) });
  }

  getBreakPoints() {
    let viewPortWidth = this.getViewportWidth();

    if (viewPortWidth <= 500) {
      return "mobile";
    }

    if (viewPortWidth >= 500 && viewPortWidth <= 850) {
      return "small";
    }

    if (viewPortWidth > 850) {
      return "big";
    }

    return "normal";
  }

  renderContent() {
    const { state } = this;
    if (state.loadState === "pristine" || state.loadState === "running") {
      return <LoadingScreen />;
    }
    if (state.loadState === "error") {
      return "Error";
    }
    return <>Ohhh, dopamine!</>;
  }

  render() {
    const viewportWidth = this.getBreakPoints();

    return (
      <>
        <DocumentTitle
          documentTitle={this.props.services.documentTitle}
          subTitle={`Notifications`}
        />
        <DefaultPageLayout
          services={this.props.services}
          storage={this.props.storage}
          viewportBreakpoint={viewportWidth}
          headerTitle={"Notifications"}
        >
          {this.renderContent()}
        </DefaultPageLayout>
      </>
    );
  }
}
