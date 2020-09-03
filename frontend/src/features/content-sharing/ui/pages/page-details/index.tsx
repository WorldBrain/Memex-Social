import moment from "moment";
import React from "react";
import styled from "styled-components";
import { UIElement, UIElementServices } from "../../../../../main-ui/classes";
import Logic, { PageDetailsState } from "./logic";
import { PageDetailsEvent, PageDetailsDependencies } from "./types";
import DocumentTitle from "../../../../../main-ui/components/document-title";
import DefaultPageLayout from "../../../../../common-ui/layouts/default-page-layout";
import LoadingScreen from "../../../../../common-ui/components/loading-screen";
import { Margin } from "styled-components-spacing";
import PageInfoBox from "../../../../../common-ui/components/page-info-box";
import AnnotationsInPage from "../../../../../common-ui/components/annotations-in-page";
import LoadingIndicator from "../../../../../common-ui/components/loading-indicator";
import ErrorBoxWithAction from "../../../../../common-ui/components/error-with-action";

const PageInfoList = styled.div`
  width: 100%;
`;

const AnnotationsLoading = styled.div`
  display: flex;
  justify-content: center;
`;

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
      state.pageInfoLoadState === "pristine" ||
      state.pageInfoLoadState === "running"
    ) {
      return (
        <DefaultPageLayout
          viewportBreakpoint={viewportWidth}
          headerTitle={"Loading page..."}
        >
          <DocumentTitle
            documentTitle={this.props.services.documentTitle}
            subTitle="Loading page..."
          />
          <LoadingScreen />
        </DefaultPageLayout>
      );
    }
    if (state.pageInfoLoadState === "error") {
      return (
        <DefaultPageLayout
          viewportBreakpoint={viewportWidth}
          headerTitle={"Could not load page"}
        >
          <DocumentTitle
            documentTitle={this.props.services.documentTitle}
            subTitle="Error loading page  :("
          />
          <ErrorBoxWithAction errorType="internal-error">
            Error loading page contents. <br /> Reload page to retry.
          </ErrorBoxWithAction>
        </DefaultPageLayout>
      );
    }

    const { annotations, creator, pageInfo } = state;
    if (!pageInfo) {
      return (
        <DefaultPageLayout
          viewportBreakpoint={viewportWidth}
          headerTitle={"Annotation"}
        >
          <ErrorBoxWithAction
            errorType="not-found"
            action={{
              label: "Create your first collection",
              url: "https://getmemex.com",
            }}
          >
            Could not find the page you were looking for. Maybe somebody shared
            it, but then removed it again?
          </ErrorBoxWithAction>
        </DefaultPageLayout>
      );
    }

    return (
      <>
        <DocumentTitle
          documentTitle={this.props.services.documentTitle}
          subTitle={`Shared page${creator ? ` by ${creator.displayName}` : ""}`}
        />
        <DefaultPageLayout
          viewportBreakpoint={viewportWidth}
          headerTitle={this.getHeaderTitle()}
          headerSubtitle={this.getHeaderSubtitle()}
        >
          <PageInfoList>
            <Margin bottom={"small"}>
              <PageInfoBox pageInfo={pageInfo} />
            </Margin>
            <Margin left={"small"} bottom="large">
              {(state.annotationLoadState === "pristine" ||
                state.annotationLoadState === "running") && (
                <Margin vertical="medium">
                  <AnnotationsLoading>
                    <LoadingIndicator />
                  </AnnotationsLoading>
                </Margin>
              )}
              {/* Modify the next line to show something if the page doesn't have any annotations */}
              {state.annotationLoadState === "success" &&
                !annotations?.length &&
                " "}
              {state.annotationLoadState === "success" &&
                !!annotations?.length && (
                  <AnnotationsInPage
                    loadState={state.annotationLoadState}
                    annotations={annotations}
                  />
                )}
              {state.annotationLoadState === "error" && (
                <AnnotationsInPage
                  loadState={state.annotationLoadState}
                  annotations={annotations}
                />
              )}
            </Margin>
          </PageInfoList>
        </DefaultPageLayout>
      </>
    );
  }

  getHeaderTitle(): string {
    const { pageInfoLoadState, pageInfo } = this.state;
    if (pageInfoLoadState === "success") {
      if (!pageInfo) {
        return "Page not found";
      }
      return `Shared on ${moment(pageInfo.createdWhen).format("LLL")}`;
    }
    if (pageInfoLoadState === "pristine" || pageInfoLoadState === "running") {
      return "Loading...";
    }
    return "Error";
  }

  getHeaderSubtitle(): string | undefined {
    const { creator } = this.state;
    return creator ? ` by ${creator.displayName}` : undefined;
  }
}
