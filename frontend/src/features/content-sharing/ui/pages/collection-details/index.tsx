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
const logoImage = require("../../../../../assets/img/memex-logo.svg");
const commentImage = require("../../../../../assets/img/comment.svg");

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
  position: sticky;
  top: 0;
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
  background-image: url(${logoImage});
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

const MarginSmall = styled.div`
  height: 10px;
`;

const MarginSmallest = styled.div`
  height: 5px;
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
  top: 10px;
  position: relative;
  padding-bottom: 100px;
  margin: 20px auto 0;
  display: flex;
  flex-direction: column;
  align-items: center;

  ${(props) =>
    props.viewportWidth === "small" &&
    css`
      width: 95%;
      top: 10px;
      margin: 20px auto 0;
    `}
  ${(props) =>
    props.viewportWidth === "mobile" &&
    css`
      width: 95%;
      top: 10px;
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
const AnnotationCreatorName = styled.div`
  font-family: "Poppins";
  color: ${(props) => props.theme.colors.primary};
  font-weight: bold;
  font-size: 12px;
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
  height: 100vh;
  width: 100%;
`;

const ErrorBox = styled.div`
  font-family: ${(props) => props.theme.fonts.primary};
  width: 100%;
  padding: 20px 20px;
  border-radius: 5px;
  box-shadow: rgba(15, 15, 15, 0.1) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 2px 4px;
  background-color: #f29d9d;
  color: white;
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
  text-align: center;
`

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

  renderAnnotationButton() {

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
          {state.annotationEntriesLoadState === "success" && annotationEntries &&
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
        <LoadingScreen viewportWidth={viewportWidth}>
          <LoadingIndicator />
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
          {state.annotationEntriesLoadState === "error" &&
            <ErrorBox>
              Error loading page notes. Reload page to retry.
            </ErrorBox>
          }
          <ToggleAllBox viewportWidth={viewportWidth}>
          {state.annotationEntriesLoadState === "success" && (
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
                      "error" && "error"}
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
