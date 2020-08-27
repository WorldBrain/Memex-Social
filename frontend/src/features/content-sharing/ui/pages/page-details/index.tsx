import moment from "moment";
import React from "react";
import styled, { css } from "styled-components";
import { UIElement, UIElementServices } from "../../../../../main-ui/classes";
import Logic, { PageDetailsState } from "./logic";
import { PageDetailsEvent, PageDetailsDependencies } from "./types";
import DocumentTitle from "../../../../../main-ui/components/document-title";
import DefaultPageLayout from "../../../../../common-ui/layouts/default-page-layout";

interface PageDetailsProps extends PageDetailsDependencies {
  services: UIElementServices;
}

export default class PageDetailsPage extends UIElement<
  PageDetailsProps,
  PageDetailsState,
  PageDetailsEvent
> {
  constructor(props: PageDetailsProps) {
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

    if (
      state.annotationLoadState === "pristine" ||
      state.annotationLoadState === "running"
    ) {
      return (
        <DefaultPageLayout
          viewportWidth={viewportWidth}
          headerTitle={"Annotation"}
        >
          Annotations loading...
        </DefaultPageLayout>
      );
    }
    if (state.annotationLoadState === "error") {
      return (
        <DefaultPageLayout
          viewportWidth={viewportWidth}
          headerTitle={"Annotation"}
        >
          Error loading annotations
        </DefaultPageLayout>
      );
    }

    const { annotations, creator, pageInfo } = state;
    if (!annotations || !annotations?.length) {
      return (
        <DefaultPageLayout
          viewportWidth={viewportWidth}
          headerTitle={"Annotation"}
        >
          No annotations...
        </DefaultPageLayout>
      );
    }

    return (
      <>
        <DocumentTitle
          documentTitle={this.props.services.documentTitle}
          subTitle={`Shared note${creator ? ` by ${creator.displayName}` : ""}`}
        />
        <DefaultPageLayout
          viewportWidth={viewportWidth}
          headerTitle={"Annotation"}
        >
          {state.pageInfoLoadState === "error" && (
            <div>Could not load page URL and title</div>
          )}
          {state.pageInfoLoadState === "running" && (
            <div>Loading page URL and title</div>
          )}
          {state.pageInfoLoadState === "success" && (
            <div>
              {!pageInfo && <div>Could not find page URL and title</div>}
              {pageInfo && (
                <>
                  <div>{pageInfo.originalUrl}</div>
                  <div>{pageInfo.fullTitle}</div>
                </>
              )}
            </div>
          )}

          {state.creatorLoadState === "error" && (
            <div>Could not load information about annotation creator</div>
          )}
          {state.creatorLoadState === "running" && (
            <div>Loading information about annotation creator</div>
          )}
          {state.creatorLoadState === "success" && (
            <div>
              {creator && creator.displayName}
              {!creator && "Could not information about annotation creator"}
            </div>
          )}
        </DefaultPageLayout>
      </>
    );
  }
}
