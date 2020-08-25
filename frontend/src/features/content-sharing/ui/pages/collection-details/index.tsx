import moment from "moment";
import React from "react";
import { Waypoint } from "react-waypoint";
import { Trans } from "react-i18next";
import styled, { css } from "styled-components";
import { Margin } from "styled-components-spacing";
import { UIElement, UIElementServices } from "../../../../../main-ui/classes";
import Logic, { CollectionDetailsState } from "./logic";
import LoadingIndicator from "../../../../../main-ui/components/loading-indicator";
import { CollectionDetailsEvent, CollectionDetailsDependencies } from "./types";
import ItemBox from "../../../../../common-ui/components/item-box";
import {
  SharedListEntry,
  SharedAnnotationListEntry,
  SharedAnnotationReference,
} from "@worldbrain/memex-common/lib/content-sharing/types";
import { PAGE_SIZE } from "./constants";
import DocumentTitle from "../../../../../main-ui/components/document-title";
import DefaultPageLayout from "../../../../../common-ui/layouts/default-page-layout";
const commentImage = require("../../../../../assets/img/comment.svg");

interface CollectionDetailsProps extends CollectionDetailsDependencies {
  services: UIElementServices;
}

const DocumentView = styled.div`
  height: 100vh;
`;

const MarginSmallest = styled.div`
  height: 5px;
`;

const SignUp = styled.div<{
  viewportWidth: "mobile" | "small" | "normal" | "big";
}>`
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 500;
  background-color: #5cd9a6;
  border-radius: 3px;
  background-color: ${(props) => props.theme.colors.secondary};
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    opacity: 0.8;
  }
`;

const CollectionDescriptionBox = styled.div<{
  viewportWidth: "mobile" | "small" | "normal" | "big";
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
  viewportWidth: "mobile" | "small" | "normal" | "big";
}>``;
const CollectionDescriptionToggle = styled.div<{
  viewportWidth: "mobile" | "small" | "normal" | "big";
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
  viewportWidth: "mobile" | "small" | "normal" | "big";
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

const PageBox = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
`;

const PageInfoList = styled.div<{
  viewportWidth: "mobile" | "small" | "normal" | "big";
}>`
  width: 100%;
`;

const PageContentBox = styled.div`
  flex: 1;
  width: 80%;
  max-width: 96%;
`;

const PageInfoBoxLink = styled.a`
  text-decoration: none;
`;

const PageInfoBoxRight = styled.div`
  text-decoration: none;
  padding: 15px 0px 15px 10px;
  cursor: default;
  width: 50px;
`;

const PageInfoBoxLeft = styled.div`
  text-decoration: none;
  padding: 15px 0px 15px 20px;
  cursor: pointer;
`;

const PageInfoBoxTop = styled.div`
  display: flex;
`;
const PageInfoBoxTitle = styled.div<{
  viewportWidth: "mobile" | "small" | "normal" | "big";
}>`
  flex-grow: 2;
  font-weight: 600;
  color: ${(props) => props.theme.colors.primary};
  text-decoration: none;
  font-size: ${(props) => props.theme.fontSize.listTitle};
  text-overflow: ellipsis;
  overflow-x: hidden;
  text-decoration: none;
  overflow-wrap: break-word;
  white-space: nowrap;
`;
const PageInfoBoxActions = styled.div`
  display: flex;
`;
const PageInfoAnnotationToggle = styled.div`
  display: block;
  width: 20px;
  height: 20px;
  cursor: pointer;
  background-image: url("${commentImage}");
  background-size: contain;
  background-position: center center;
  background-repeat: no-repeat;
`;

const PageInfoBoxUrl = styled.div<{
  viewportWidth: "mobile" | "small" | "normal" | "big";
}>`
  font-weight: 400;
  font-size: ${(props) => props.theme.fontSize.url};
  color: ${(props) => props.theme.colors.subText};
  text-overflow: ellipsis;
  overflow-x: hidden;
  text-decoration: none;
  overflow-wrap: break-word;
  white-space: nowrap;
  max-width: 100%;
`;

const AnnotationContainer = styled.div`
  display: flex;
  justify-content: center;
`;

const AnnotationLine = styled.span`
  height: auto;
  width: 6px;
  background: #e0e0e0;
  margin: -8px 10px 5px;
`;

const AnnotationList = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  justify-content: center;
  align-items: center;
  min-height: 50px;
`;

const AnnotationBox = styled.div`
  font-family: ${(props) => props.theme.fonts.primary};
  padding: 15px 20px;
`;

const AnnotationBody = styled.span`
  background-color: ${(props) => props.theme.colors.secondary};
  white-space: normal;
  padding: 0 5px;
  box-decoration-break: clone;
  font-size: 14px;
  color: ${(props) => props.theme.colors.primary};
`;

const AnnotationComment = styled.div`
  font-size: 14px;
  color: ${(props) => props.theme.colors.primary};
`;
const AnnotationDate = styled.div`
  font-family: "Poppins";
  font-weight: normal;
  font-size: 12px;
  color: ${(props) => props.theme.colors.primary};
`;

const LoadingScreen = styled.div<{
  viewportWidth: "mobile" | "small" | "normal" | "big";
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
`;

const ErrorBox = styled.div`
  font-family: ${(props) => props.theme.fonts.primary};
  width: 100%;
  padding: 20px 20px;
  border-radius: 5px;
  box-shadow: rgba(15, 15, 15, 0.1) 0px 0px 0px 1px,
    rgba(15, 15, 15, 0.1) 0px 2px 4px;
  background-color: #f29d9d;
  color: white;
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
  text-align: center;
`;

const ErrorBoxAnnotation = styled.div`
  font-family: ${(props) => props.theme.fonts.primary};
  width: 100%;
  padding: 20px 20px;
  border-radius: 5px;
  box-shadow: rgba(15, 15, 15, 0.1) 0px 0px 0px 1px,
    rgba(15, 15, 15, 0.1) 0px 2px 4px;
  background-color: #f29d9d;
  color: white;
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
  text-align: center;
`;

const ListNotFoundBox = styled.div`
  font-family: ${(props) => props.theme.fonts.primary};
  width: 100%;
  padding: 20px 20px;
  color: ${(props) => props.theme.colors.primary};
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  margin: 30px;
  text-align: center;
`;

const ListNotFoundText = styled.div`
  margin-bottom: 20px;
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
  CollectionDetailsProps,
  CollectionDetailsState,
  CollectionDetailsEvent
> {
  constructor(props: CollectionDetailsProps) {
    super(props, { logic: new Logic(props) });
  }

  getScreenWidth() {
    return this.getViewportWidth();
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

  renderPageEntry(entry: SharedListEntry) {
    const viewportWidth = this.getBreakPoints();
    const annotationEntries = this.state.annotationEntryData;
    const { state } = this;
    return (
      <ItemBox>
        <PageBox>
          <PageContentBox>
            <PageInfoBoxLink href={entry.originalUrl} target="_blank">
              <PageInfoBoxLeft>
                <PageInfoBoxTop>
                  <PageInfoBoxTitle
                    title={entry.entryTitle}
                    viewportWidth={viewportWidth}
                  >
                    {entry.entryTitle}
                  </PageInfoBoxTitle>
                </PageInfoBoxTop>
                <Margin bottom="smallest">
                  <PageInfoBoxUrl viewportWidth={viewportWidth}>
                    {entry.normalizedUrl}
                  </PageInfoBoxUrl>
                </Margin>
                <AnnotationDate>
                  {moment(entry.createdWhen).format("LLL")}
                </AnnotationDate>
              </PageInfoBoxLeft>
            </PageInfoBoxLink>
          </PageContentBox>
          {state.annotationEntriesLoadState === "running" && (
            <PageInfoBoxRight>
              <PageInfoBoxActions>
                <LoadingIndicator />
              </PageInfoBoxActions>
            </PageInfoBoxRight>
          )}
          {state.annotationEntriesLoadState === "success" &&
            annotationEntries &&
            annotationEntries[entry.normalizedUrl] &&
            annotationEntries[entry.normalizedUrl].length && (
              <PageInfoBoxRight>
                <PageInfoBoxActions>
                  <PageInfoAnnotationToggle
                    onClick={(event) =>
                      this.processEvent("togglePageAnnotations", {
                        normalizedUrl: entry.normalizedUrl,
                      })
                    }
                  />
                </PageInfoBoxActions>
              </PageInfoBoxRight>
            )}
        </PageBox>
      </ItemBox>
    );
  }

  renderAnnotationEntry(
    annotationEntry: SharedAnnotationListEntry & {
      sharedAnnotation: SharedAnnotationReference;
    }
  ) {
    const { state } = this;
    const annotationID = this.props.contentSharing.getSharedAnnotationLinkID(
      annotationEntry.sharedAnnotation
    );
    const annotation = state.annotations[annotationID];
    if (!annotation) {
      return null;
    }
    return (
      <>
        <ItemBox>
          <AnnotationBox key={annotationID}>
            {annotation.body && (
              <Margin bottom="small">
                <AnnotationBody>{annotation.body}</AnnotationBody>
              </Margin>
            )}
            <Margin bottom="small">
              <AnnotationComment>{annotation.comment}</AnnotationComment>
            </Margin>
            <AnnotationDate>
              {moment(annotation.createdWhen).format("LLL")}
            </AnnotationDate>
          </AnnotationBox>
        </ItemBox>
        <MarginSmallest />
      </>
    );
  }

  render() {
    //const small = this.getViewportWidth() < 500;
    //const large = this.getViewportWidth() > 1200;
    //const layout = !large ? "vertical" : "horizontal";
    //const horizontalMargin = small ? "none" : "normal";
    const viewportWidth = this.getBreakPoints();

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
          <LoadingScreen viewportWidth={viewportWidth}>
            <LoadingIndicator />
          </LoadingScreen>
        </DocumentView>
      );
    }
    if (state.listLoadState === "error") {
      return (
        <DocumentView>
          <DefaultPageLayout viewportWidth={viewportWidth}>
            <ListNotFoundBox>
              <ErrorBox>
                Error loading this collection. <br /> Reload page to retry.
              </ErrorBox>
              <SignUp
                onClick={() => window.open("https://worldbrain.io/report-bugs")}
                viewportWidth={viewportWidth}
              >
                Report Problem
              </SignUp>
            </ListNotFoundBox>
          </DefaultPageLayout>
        </DocumentView>
      );
    }

    const data = state.listData;
    if (!data) {
      return (
        <DefaultPageLayout viewportWidth={viewportWidth}>
          <ListNotFoundBox>
            <ListNotFoundText>
              You're trying to access a collection that does not exist (yet).
            </ListNotFoundText>
            <SignUp
              onClick={() => window.open("https://getmemex.com")}
              viewportWidth={viewportWidth}
            >
              Create your first collection
            </SignUp>
          </ListNotFoundBox>
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
          viewportWidth={viewportWidth}
          headerTitle={data.list.title}
          headerSubtitle={
            data.creatorDisplayName && `by ${data.creatorDisplayName}`
          }
        >
          {data.list.description && (
            <CollectionDescriptionBox viewportWidth={viewportWidth}>
              <CollectionDescriptionText viewportWidth={viewportWidth}>
                {data.listDescriptionState === "collapsed"
                  ? data.listDescriptionTruncated
                  : data.list.description}
              </CollectionDescriptionText>
              {data.listDescriptionState !== "fits" && (
                <CollectionDescriptionToggle
                  onClick={() =>
                    this.processEvent("toggleDescriptionTruncation", {})
                  }
                  viewportWidth={viewportWidth}
                >
                  {data.listDescriptionState === "collapsed" ? (
                    <Trans>▸ Show more</Trans>
                  ) : (
                    <Trans>◂ Show less</Trans>
                  )}
                </CollectionDescriptionToggle>
              )}
            </CollectionDescriptionBox>
          )}
          {state.annotationEntriesLoadState === "error" && (
            <ErrorBox>Error loading page notes. Reload page to retry.</ErrorBox>
          )}
          <ToggleAllBox viewportWidth={viewportWidth}>
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
          <PageInfoList viewportWidth={viewportWidth}>
            {data.listEntries.length === 0 && (
              <EmptyListBox>
                <ListNotFoundText>
                  This collection has no entries.
                </ListNotFoundText>
                <SignUp
                  onClick={() => window.open("https://getmemex.com")}
                  viewportWidth={viewportWidth}
                >
                  Create your first collection
                </SignUp>
              </EmptyListBox>
            )}
            {[...data.listEntries.entries()].map(([entryIndex, entry]) => (
              <React.Fragment key={entry.normalizedUrl}>
                <Margin bottom={"small"}>{this.renderPageEntry(entry)}</Margin>
                {state.pageAnnotationsExpanded[entry.normalizedUrl] && (
                  <Margin left={"small"}>
                    {state.annotationLoadStates[entry.normalizedUrl] ===
                      "running" && (
                      <Margin bottom={"large"}>
                        <AnnotationContainer>
                          <AnnotationLine />
                          <AnnotationList>
                            <LoadingIndicator />
                          </AnnotationList>
                        </AnnotationContainer>
                      </Margin>
                    )}
                    {state.annotationLoadStates[entry.normalizedUrl] ===
                      "error" && (
                      <Margin bottom={"large"}>
                        <AnnotationContainer>
                          <AnnotationLine />
                          <ErrorBoxAnnotation>
                            Error loading page notes. <br /> Reload page to
                            retry.
                          </ErrorBoxAnnotation>
                        </AnnotationContainer>
                      </Margin>
                    )}
                    {state.annotationLoadStates[entry.normalizedUrl] ===
                      "success" && (
                      <Margin bottom={"large"}>
                        <AnnotationContainer>
                          <AnnotationLine />
                          <AnnotationList>
                            {state.annotationEntryData![
                              entry.normalizedUrl
                            ].map((annotationEntry) =>
                              this.renderAnnotationEntry(annotationEntry)
                            )}
                          </AnnotationList>
                        </AnnotationContainer>
                      </Margin>
                    )}
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
    // const breakPoints = this.getStyleBreakpoints({
    //   small: 160,
    //   medium: 640,
    //   large: 860,
    // });

    // return (
    //   <StyledFoo onClick={() => this.processEvent("toggle", {})}>
    //     foo: {state.foo ? "true" : "false"}
    //     <br />
    //     {/* breakPoints: {JSON.stringify(breakPoints)} */}
    //   </StyledFoo>
    // );
  }
}
