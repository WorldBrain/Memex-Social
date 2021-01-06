import React from "react";
import { Waypoint } from "react-waypoint";
import styled, { css } from "styled-components";
import { Margin } from "styled-components-spacing";
import { UIElement } from "../../../../../main-ui/classes";
import Logic from "./logic";
import LoadingIndicator from "../../../../../common-ui/components/loading-indicator";
import {
  CollectionDetailsEvent,
  CollectionDetailsDependencies,
  CollectionDetailsState,
} from "./types";
import {
  SharedListEntry,
  SharedAnnotationListEntry,
  SharedAnnotationReference,
} from "@worldbrain/memex-common/lib/content-sharing/types";
import { PAGE_SIZE } from "./constants";
import DocumentTitle from "../../../../../main-ui/components/document-title";
import DefaultPageLayout from "../../../../../common-ui/layouts/default-page-layout";
import PageInfoBox, {
  PageInfoBoxAction,
} from "../../../../../common-ui/components/page-info-box";
import { ViewportBreakpoint } from "../../../../../main-ui/styles/types";
import LoadingScreen from "../../../../../common-ui/components/loading-screen";
import { getViewportBreakpoint } from "../../../../../main-ui/styles/utils";
import AnnotationsInPage from "../../../../annotations/ui/components/annotations-in-page";
import ErrorWithAction from "../../../../../common-ui/components/error-with-action";
import ErrorBox from "../../../../../common-ui/components/error-box";
const commentImage = require("../../../../../assets/img/comment.svg");

const DocumentView = styled.div`
  height: 100vh;
`;

const CollectionDescriptionBox = styled.div<{
  viewportWidth: ViewportBreakpoint;
}>`
  font-family: ${(props) => props.theme.fonts.primary};
  font-size: 14px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin: ${(props) =>
    props.viewportWidth === "small" || props.viewportWidth === "mobile"
      ? "20px 5px"
      : "20px auto"};
`;
const CollectionDescriptionText = styled.div<{
  viewportWidth: ViewportBreakpoint;
}>``;
const CollectionDescriptionToggle = styled.div<{
  viewportWidth: ViewportBreakpoint;
}>`
  cursor: pointer;
  padding: 3px 5px;
  margin-left: -5px;
  border-radius: ${(props) => props.theme.borderRadius.default};
  color: ${(props) => props.theme.colors.subText};

  &:hover {
    background-color: ${(props) => props.theme.hoverBackground.primary};
  }
`;

const ToggleAllBox = styled.div<{
  viewportWidth: ViewportBreakpoint;
}>`
  display: flex;
  justify-content: flex-end;
  width: 100%;
  position: sticky;
  top: 35px;
  z-index: 2;
  border-radius: 5px;

  ${(props) =>
    props.viewportWidth === "small" &&
    css`
      top: 55px;
    `}

  ${(props) =>
    props.viewportWidth === "mobile" &&
    css`
      top: 45px;
    `}
}
`;

const ToggleAllAnnotations = styled.div`
  text-align: right;
  font-weight: bold;
  font-family: "Poppins";
  color: ${(props) => props.theme.colors.primary};
  font-weight: bold;
  cursor: pointer;
  font-size: 12px;
  width: fit-content;
  background-color: #fff;
  padding: 0 5px;
  margin: 5px 0 10px;
  border-radius: 5px;
`;

const PageInfoList = styled.div`
  width: 100%;
`;

const EmptyListBox = styled.div`
  font-family: ${(props) => props.theme.fonts.primary};
  width: 100%;
  padding: 20px 20px;
  color: ${(props) => props.theme.colors.primary};
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  text-align: center;
`;

export default class CollectionDetailsPage extends UIElement<
  CollectionDetailsDependencies,
  CollectionDetailsState,
  CollectionDetailsEvent
> {
  constructor(props: CollectionDetailsDependencies) {
    super(props, { logic: new Logic(props) });
  }

  renderPageEntry(entry: SharedListEntry) {
    return (
      <PageInfoBox
        pageInfo={{
          ...entry,
          fullTitle: entry.entryTitle,
        }}
        actions={this.getPageEntryActions(entry)}
      />
    );
  }

  getPageEntryActions(
    entry: SharedListEntry
  ): Array<PageInfoBoxAction> | undefined {
    const { state } = this;
    const annotationEntries = this.state.annotationEntryData;

    if (
      state.annotationEntriesLoadState === "pristine" ||
      state.annotationEntriesLoadState === "running"
    ) {
      return [{ node: <LoadingIndicator key="loading" /> }];
    }

    const shouldShowAnnotationsButton =
      state.annotationEntriesLoadState === "success" &&
      annotationEntries &&
      annotationEntries[entry.normalizedUrl] &&
      annotationEntries[entry.normalizedUrl].length;

    if (shouldShowAnnotationsButton) {
      return [
        {
          image: commentImage,
          onClick: () =>
            this.processEvent("togglePageAnnotations", {
              normalizedUrl: entry.normalizedUrl,
            }),
        },
      ];
    }
  }

  renderPageAnnotations(entry: SharedListEntry) {
    const { state } = this;
    return (
      <AnnotationsInPage
        loadState={state.annotationLoadStates[entry.normalizedUrl]}
        annotations={
          state.annotationEntryData &&
          state.annotationEntryData[entry.normalizedUrl] &&
          state.annotationEntryData &&
          state.annotationEntryData[
            entry.normalizedUrl
          ].map((annotationEntry) => this.getAnnotation(annotationEntry))
        }
        annotationConversations={this.state.conversations}
        getAnnotationCreator={() => this.state.listData?.creator}
        onNewReplyInitiate={(event) =>
          this.processEvent("initiateNewReplyToAnnotation", event)
        }
        onNewReplyCancel={(event) =>
          this.processEvent("cancelNewReplyToAnnotation", event)
        }
        onNewReplyConfirm={(event) =>
          this.processEvent("confirmNewReplyToAnnotation", event)
        }
        onNewReplyEdit={(event) =>
          this.processEvent("editNewReplyToAnnotation", event)
        }
        onToggleReplies={(event) =>
          this.processEvent("toggleAnnotationReplies", event)
        }
      />
    );
  }

  getAnnotation(
    annotationEntry: SharedAnnotationListEntry & {
      sharedAnnotation: SharedAnnotationReference;
    }
  ) {
    const { state } = this;
    const annotationID = this.props.storage.contentSharing.getSharedAnnotationLinkID(
      annotationEntry.sharedAnnotation
    );
    const annotation = state.annotations[annotationID];
    return annotation ?? null;
  }

  render() {
    const viewportBreakpoint = getViewportBreakpoint(this.getViewportWidth());

    const { state } = this;
    if (
      state.listLoadState === "pristine" ||
      state.listLoadState === "running"
    ) {
      return (
        <DocumentView>
          <DocumentTitle
            documentTitle={this.props.services.documentTitle}
            subTitle="Loading list..."
          />
          <LoadingScreen />
        </DocumentView>
      );
    }
    if (state.listLoadState === "error") {
      return (
        <DocumentView>
          <DefaultPageLayout
            services={this.props.services}
            storage={this.props.storage}
            viewportBreakpoint={viewportBreakpoint}
          >
            <ErrorWithAction errorType="internal-error">
              Error loading this collection. <br /> Reload page to retry.
            </ErrorWithAction>
          </DefaultPageLayout>
        </DocumentView>
      );
    }

    const data = state.listData;
    if (!data) {
      return (
        <DefaultPageLayout
          services={this.props.services}
          storage={this.props.storage}
          viewportBreakpoint={viewportBreakpoint}
        >
          <ErrorWithAction
            errorType="not-found"
            action={{
              label: "Create your first collection",
              url: "https://getmemex.com",
            }}
          >
            You're trying to access a collection that does not exist (yet).
          </ErrorWithAction>
        </DefaultPageLayout>
      );
    }

    return (
      <>
        <DocumentTitle
          documentTitle={this.props.services.documentTitle}
          subTitle={data.list.title}
        />
        <DefaultPageLayout
          services={this.props.services}
          storage={this.props.storage}
          viewportBreakpoint={viewportBreakpoint}
          headerTitle={data.list.title}
          headerSubtitle={data.creator && `by ${data.creator.displayName}`}
        >
          {data.list.description && (
            <CollectionDescriptionBox viewportWidth={viewportBreakpoint}>
              <CollectionDescriptionText viewportWidth={viewportBreakpoint}>
                {data.listDescriptionState === "collapsed"
                  ? data.listDescriptionTruncated
                  : data.list.description}
              </CollectionDescriptionText>
              {data.listDescriptionState !== "fits" && (
                <CollectionDescriptionToggle
                  onClick={() =>
                    this.processEvent("toggleDescriptionTruncation", {})
                  }
                  viewportWidth={viewportBreakpoint}
                >
                  {data.listDescriptionState === "collapsed"
                    ? "▸ Show more"
                    : "◂ Show less"}
                </CollectionDescriptionToggle>
              )}
            </CollectionDescriptionBox>
          )}
          {state.annotationEntriesLoadState === "error" && (
            <Margin bottom={"large"}>
              <ErrorWithAction errorType="internal-error">
                Error loading page notes. Reload page to retry.
              </ErrorWithAction>
            </Margin>
          )}
          <ToggleAllBox viewportWidth={viewportBreakpoint}>
            {state.annotationEntryData &&
              Object.keys(state.annotationEntryData).length > 0 && (
                <ToggleAllAnnotations
                  onClick={() => this.processEvent("toggleAllAnnotations", {})}
                >
                  {state.allAnnotationExpanded
                    ? "Hide all annotations"
                    : "Show all annotations"}
                </ToggleAllAnnotations>
              )}
          </ToggleAllBox>
          <PageInfoList>
            {data.listEntries.length === 0 && (
              <EmptyListBox>
                <ErrorBox>This collection has no pages in it (yet).</ErrorBox>
              </EmptyListBox>
            )}
            {[...data.listEntries.entries()].map(([entryIndex, entry]) => (
              <React.Fragment key={entry.normalizedUrl}>
                <Margin bottom={"small"}>{this.renderPageEntry(entry)}</Margin>
                {state.pageAnnotationsExpanded[entry.normalizedUrl] && (
                  <Margin left={"small"}>
                    <Margin bottom={"smallest"}>
                      {this.renderPageAnnotations(entry)}
                    </Margin>
                  </Margin>
                )}
                {state.allAnnotationExpanded &&
                  state.annotationEntriesLoadState === "success" &&
                  entryIndex > 0 &&
                  entryIndex % PAGE_SIZE === 0 && (
                    <Waypoint
                      onEnter={() => {
                        this.processEvent("pageBreakpointHit", {
                          entryIndex,
                        });
                      }}
                    />
                  )}
              </React.Fragment>
            ))}
          </PageInfoList>
        </DefaultPageLayout>
      </>
    );
  }
}
