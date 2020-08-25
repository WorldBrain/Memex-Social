import React from "react";
import styled, { css } from "styled-components";
import { UIElement, UIElementServices } from "../../../../../main-ui/classes";
import Logic, { AnnotationDetailsState } from "./logic";
import { AnnotationDetailsEvent, AnnotationDetailsDependencies } from "./types";
import DocumentTitle from "../../../../../main-ui/components/document-title";
import DefaultPageLayout from "../../../../../common-ui/layouts/default-page-layout";

interface AnnotationDetailsProps extends AnnotationDetailsDependencies {
  services: UIElementServices;
}

export default class AnnotationDetailsPage extends UIElement<
  AnnotationDetailsProps,
  AnnotationDetailsState,
  AnnotationDetailsEvent
> {
  constructor(props: AnnotationDetailsProps) {
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

  render() {
    const viewportWidth = this.getBreakPoints();

    const { state } = this;

    return (
      <>
        <DocumentTitle
          documentTitle={this.props.services.documentTitle}
          subTitle={"Annotation"}
        />
        <DefaultPageLayout
          viewportWidth={viewportWidth}
          headerTitle={"Annotation"}
        >
          test
        </DefaultPageLayout>
      </>
    );
  }
}
