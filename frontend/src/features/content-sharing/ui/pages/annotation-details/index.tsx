import moment from "moment";
import React from "react";
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

    if (
      state.annotationLoadState === "pristine" ||
      state.annotationLoadState === "running"
    ) {
      return (
        <DefaultPageLayout
          viewportBreakpoint={viewportWidth}
          headerTitle={"Annotation"}
        >
          Annotation loading...
        </DefaultPageLayout>
      );
    }
    if (state.annotationLoadState === "error") {
      return (
        <DefaultPageLayout
          viewportBreakpoint={viewportWidth}
          headerTitle={"Annotation"}
        >
          Error loading annotation
        </DefaultPageLayout>
      );
    }

    const { annotation, creator, pageInfo } = state;
    if (!annotation) {
      return (
        <DefaultPageLayout
          viewportBreakpoint={viewportWidth}
          headerTitle={"Annotation"}
        >
          Could not find annotation
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
          viewportBreakpoint={viewportWidth}
          headerTitle={"Annotation"}
        >
          <div>{annotation.body}</div>
          <div>{annotation.comment}</div>
          <div>{moment(annotation.createdWhen).format("LLL")}</div>

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
                  <div>{pageInfo.pageTitle}</div>
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
