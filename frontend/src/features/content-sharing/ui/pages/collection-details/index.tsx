import moment from "moment";
import React from "react";
import { Trans } from "react-i18next";
import styled, { css } from "styled-components";
import { Margin } from "styled-components-spacing";
import { UIElement, UIElementServices } from "../../../../../main-ui/classes";
import Logic, { CollectionDetailsState } from "./logic";
import LoadingIndictator from "../../../../../main-ui/components/loading-indicator";
import { CollectionDetailsEvent, CollectionDetailsDependencies } from "./types";
import ItemBox from "../../../../../common-ui/components/item-box";
import {
  SharedListEntry,
  SharedAnnotationListEntry,
  SharedAnnotationReference,
} from "@worldbrain/memex-common/lib/content-sharing/types";

interface CollectionDetailsProps extends CollectionDetailsDependencies {
  services: UIElementServices;
}

const middleMaxWidth = "800px";
const StyledHeader = styled.div<{
  viewportWidth: "mobile" | "small" | "normal" | "big";
}>`
  font-family: ${(props) => props.theme.fonts.primary};
  width: 100%;
  height: 50px;
  display: flex;
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
  justify-content: space-between;
  padding: 0 20px;
  position: fixed;
  background-color: #fff;
  margin-top: -20px;
  z-index: 2;
  align-items: center;
  height: 50px;

  ${(props) =>
    props.viewportWidth === "small" &&
    css`
      height: 70px;
    `}

  ${(props) =>
    props.viewportWidth === "mobile" &&
    css`
      height: 60px;
    `}
`;
const HeaderLogoArea = styled.div<{
  viewportWidth: "mobile" | "small" | "normal" | "big";
}>`
  align-items: center;
  flex: 1;

  ${(props) =>
    (props.viewportWidth === "small" || props.viewportWidth === "mobile") &&
    css`
      background-position: center left;
      background-size: cover;
      width: 40px;
      border: none;
      flex: none;
    `}
`;

const MemexLogo = styled.div<{
  viewportWidth: "mobile" | "small" | "normal" | "big";
}>`
  height: 24px;
  background-position: center;
  background-size: contain;
  width: 100px;
  border: none;
  cursor: pointer;
  margin-right: 20px;
  background-repeat: no-repeat;
  background-image: url("https://getmemex.com/static/logo-memex-0d1fa6f00a7b0e7843b94854f3b6cb39.svg");
  display: flex;

  ${(props) =>
    (props.viewportWidth === "small" || props.viewportWidth === "mobile") &&
    css`
      background-position: center left;
      background-size: cover;
      width: 24px;
      border: none;
    `}
`;

const HeaderMiddleArea = styled.div<{
  viewportWidth: "mobile" | "small" | "normal" | "big";
}>`
  width: ${(props) =>
    props.viewportWidth === "small" || props.viewportWidth === "mobile"
      ? "95%"
      : "80%"};
  max-width: ${middleMaxWidth};
  display: flex;
  padding-right: 20px;
  align-items: ${(props) =>
    props.viewportWidth === "small" || props.viewportWidth === "mobile"
      ? "flex-start"
      : "center"};
  justify-content: flex-start;
  flex-direction: ${(props) =>
    props.viewportWidth === "small" || props.viewportWidth === "mobile"
      ? "column"
      : "row"};
`;
const HeaderTitle = styled.div<{
  viewportWidth: "mobile" | "small" | "normal" | "big";
}>`
  font-weight: 600;
  text-overflow: ellipsis;
  overflow-x: hidden;
  font-size: 16px;
  overflow-wrap: break-word;
  white-space: nowrap;
  max-width: ${(props) =>
    props.viewportWidth === "small" || props.viewportWidth === "mobile"
      ? "100%"
      : "70%"};
  color: ${(props) => props.theme.colors.primary}
    ${(props) =>
      props.viewportWidth === "small" &&
      css`
        font-size: 14px;
      `}
    ${(props) =>
      props.viewportWidth === "mobile" &&
      css`
        font-size: 14px;
      `};
`;
const HeaderSubtitle = styled.div<{
  viewportWidth: "mobile" | "small" | "normal" | "big";
}>`
  margin-left: ${(props) =>
    props.viewportWidth === "small" || props.viewportWidth === "mobile"
      ? "0px"
      : "10px"};
  font-weight: 500;
  margin-top: 1px;
  font-size: 14px;
  color: ${(props) => props.theme.colors.subText};

  ${(props) =>
    props.viewportWidth === "small" &&
    css`
      font-size: 12px;
    `}
  ${(props) =>
    props.viewportWidth === "mobile" &&
    css`
      font-size: 10px;
    `}
`;
const HeaderCtaArea = styled.div<{
  viewportWidth: "mobile" | "small" | "normal" | "big";
}>`
  flex: 1;
  display: ${(props) => (props.viewportWidth === "mobile" ? "none" : "flex")};
  align-items: center;
  justify-content: flex-end;
  white-space: nowrap;
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

const PageMiddleArea = styled.div<{
  viewportWidth: "mobile" | "small" | "normal" | "big";
}>`
  max-width: ${middleMaxWidth};
  top: 50px;
  position: relative;
  padding-bottom: 100px;
  margin: 20px auto 0;

  ${(props) =>
    props.viewportWidth === "small" &&
    css`
      width: 95%;
      top: 70px;
      margin: 20px auto 0;
    `}
  ${(props) =>
    props.viewportWidth === "mobile" &&
    css`
      width: 95%;
      top: 60px;
      margin: 20px auto 0;
    `}
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

const ToggleAllAnnotations = styled.div`
  text-align: right;
  font-weight: bold;
`;

const PageInfoList = styled.div<{
  viewportWidth: "mobile" | "small" | "normal" | "big";
}>``;

const PageInfoBoxLink = styled.a`
  text-decoration: none;
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
const PageInfoBoxAction = styled.div`
  display: block;
  width: 20px;
  height: 20px;
  background: black;
  margin-left: 10px;
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

const AnnotationBox = styled.div`
  font-family: ${(props) => props.theme.fonts.primary};
`;
const AnnotationBody = styled.div`
  background-color: ${(props) => props.theme.colors.secondary};
`;
const AnnotationComment = styled.div``;
const AnnotationCreatorName = styled.div``;
const AnnotationDate = styled.div``;

const LoadingScreen = styled.div<{
  viewportWidth: "mobile" | "small" | "normal" | "big";
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100%;
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

    return (
      <PageInfoBoxLink href={entry.originalUrl} target="_blank">
        <ItemBox>
          <PageInfoBoxTop>
            <PageInfoBoxTitle
              title={entry.entryTitle}
              viewportWidth={viewportWidth}
            >
              {entry.entryTitle}
            </PageInfoBoxTitle>
            {annotationEntries &&
              annotationEntries[entry.normalizedUrl] &&
              annotationEntries[entry.normalizedUrl].length && (
                <PageInfoBoxActions>
                  <PageInfoBoxAction></PageInfoBoxAction>
                </PageInfoBoxActions>
              )}
          </PageInfoBoxTop>
          <PageInfoBoxUrl viewportWidth={viewportWidth}>
            {entry.normalizedUrl}
          </PageInfoBoxUrl>
        </ItemBox>
      </PageInfoBoxLink>
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
      <Margin key={annotationID} bottom="smallest">
        <ItemBox>
          <AnnotationBox>
            <Margin bottom="small">
              <AnnotationBody>{annotation.body}</AnnotationBody>
            </Margin>
            <Margin bottom="small">
              <AnnotationComment>{annotation.comment}</AnnotationComment>
            </Margin>
            <Margin bottom="small">
              <AnnotationCreatorName>
                {state.listData?.creatorDisplayName}
              </AnnotationCreatorName>
            </Margin>
            <AnnotationDate>
              {moment(annotation.uploadedWhen).calendar()}
            </AnnotationDate>
          </AnnotationBox>
        </ItemBox>
      </Margin>
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
        <LoadingScreen viewportWidth={viewportWidth}>
          <LoadingIndictator />
        </LoadingScreen>
      );
    }
    if (state.listLoadState === "error") {
      return <Trans>Error while loading list</Trans>;
    }

    const data = state.listData;
    if (!data) {
      return <Trans>List not found</Trans>;
    }

    return (
      <>
        <StyledHeader viewportWidth={viewportWidth}>
          <HeaderLogoArea
            onClick={() => window.open("https://getmemex.com")}
            viewportWidth={viewportWidth}
          >
            <MemexLogo viewportWidth={viewportWidth} />
          </HeaderLogoArea>
          <HeaderMiddleArea viewportWidth={viewportWidth}>
            <HeaderTitle title={data.list.title} viewportWidth={viewportWidth}>
              {data.list.title}
            </HeaderTitle>
            {data.creatorDisplayName && (
              <HeaderSubtitle viewportWidth={viewportWidth}>
                by {data.creatorDisplayName}
              </HeaderSubtitle>
            )}
          </HeaderMiddleArea>
          <HeaderCtaArea viewportWidth={viewportWidth}>
            <SignUp
              onClick={() => window.open("https://getmemex.com")}
              viewportWidth={viewportWidth}
            >
              Share your research
            </SignUp>
          </HeaderCtaArea>
        </StyledHeader>
        <PageMiddleArea viewportWidth={viewportWidth}>
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
          {state.annotationEntriesLoadState === "running" &&
            "Loading annotation entries..."}
          {state.annotationEntriesLoadState === "error" &&
            "Error loading annotation entries  :("}
          <Margin vertical="small">
            <ToggleAllAnnotations>
              {true ? "Hide all annotations" : "Show all annotations"}
            </ToggleAllAnnotations>
          </Margin>
          <PageInfoList viewportWidth={viewportWidth}>
            {data.listEntries.map((entry) => (
              <React.Fragment key={entry.normalizedUrl}>
                <Margin bottom={"smallest"}>
                  {this.renderPageEntry(entry)}
                </Margin>
                {state.pageAnnotationsExpanded[entry.normalizedUrl] && (
                  <Margin left={"small"} bottom={"small"}>
                    {state.annotationLoadStates[entry.normalizedUrl] ===
                      "running" && "running"}
                    {state.annotationLoadStates[entry.normalizedUrl] ===
                      "error" && "error"}
                    {state.annotationLoadStates[entry.normalizedUrl] ===
                      "success" &&
                      state.annotationEntryData![
                        entry.normalizedUrl
                      ].map((annotationEntry) =>
                        this.renderAnnotationEntry(annotationEntry)
                      )}
                  </Margin>
                )}
              </React.Fragment>
            ))}
          </PageInfoList>
        </PageMiddleArea>
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
