import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { Margin } from "styled-components-spacing";
import { UIElement, UIElementServices } from "../../../../../main-ui/classes";
import Logic, { CollectionDetailsState } from "./logic";
import { CollectionDetailsEvent, CollectionDetailsDependencies } from "./types";

interface CollectionDetailsProps extends CollectionDetailsDependencies {
  services: UIElementServices;
}

const middleWidth = "800px";
const StyledHeader = styled.div`
  font-family: ${(props) => props.theme.fonts.primary};
  width: 100%;
  display: flex;
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
  padding: ${(props) => props.theme.spacing.largest} 0;
`;
const HeaderLogoArea = styled.div`
  flex-grow: 2;
`;
const HeaderMiddleArea = styled.div`
  width: ${middleWidth};
`;
const HeaderTitle = styled.div``;
const HeaderSubtitle = styled.div``;
const HeaderCtaArea = styled.div``;

const PageMiddleArea = styled.div`
  margin: 0 auto;
  width: ${middleWidth};
`;

const CollectionDescriptionBox = styled.div`
  font-family: ${(props) => props.theme.fonts.primary};
`;
const CollectionDescriptionText = styled.div``;
const CollectionDescriptionToggle = styled.div`
  cursor: pointer;
`;

const PageInfoList = styled.div``;
const PageInfoBox = styled.div`
  font-family: ${(props) => props.theme.fonts.primary};
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
  box-shadow: 0px 1px 5px rgba(0, 0, 0, 0.2);
  border-radius: 5px;
`;
const PageInfoBoxTitle = styled.div``;
const PageInfoBoxUrl = styled.div``;

export default class CollectionDetailsPage extends UIElement<
  CollectionDetailsProps,
  CollectionDetailsState,
  CollectionDetailsEvent
> {
  constructor(props: CollectionDetailsProps) {
    super(props, { logic: new Logic(props) });
  }

  render() {
    if (
      this.state.loadState === "pristine" ||
      this.state.loadState === "running"
    ) {
      return (
        <>
          <Trans>Loading</Trans>...
        </>
      );
    }
    if (this.state.loadState === "error") {
      return <Trans>Error while loading list</Trans>;
    }

    const data = this.state.data;
    if (!data) {
      return <Trans>List not found</Trans>;
    }

    return (
      <>
        <StyledHeader>
          <HeaderLogoArea></HeaderLogoArea>
          <HeaderMiddleArea>
            <HeaderTitle>{data.list.title}</HeaderTitle>
            <HeaderSubtitle></HeaderSubtitle>
          </HeaderMiddleArea>
          <HeaderCtaArea>
            + <Trans>Share your online research</Trans>
          </HeaderCtaArea>
        </StyledHeader>
        <PageMiddleArea>
          <CollectionDescriptionBox>
            <CollectionDescriptionText>
              {data.listDescriptionState === "collapsed"
                ? data.listDescriptionTruncated
                : data.list.description}
            </CollectionDescriptionText>
            {data.listDescriptionState !== "fits" && (
              <CollectionDescriptionToggle
                onClick={() =>
                  this.processEvent("toggleDescriptionTruncation", {})
                }
              >
                {data.listDescriptionState === "collapsed" ? (
                  <Trans>Show more</Trans>
                ) : (
                  <Trans>Show less</Trans>
                )}
              </CollectionDescriptionToggle>
            )}
          </CollectionDescriptionBox>
          <PageInfoList>
            {data.listEntries.map((entry) => (
              <Margin key={entry.normalizedUrl} vertical="medium">
                <PageInfoBox>
                  <PageInfoBoxTitle>{entry.entryTitle}</PageInfoBoxTitle>
                  <PageInfoBoxUrl>{entry.originalUrl}</PageInfoBoxUrl>
                </PageInfoBox>
              </Margin>
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
    //     foo: {this.state.foo ? "true" : "false"}
    //     <br />
    //     {/* breakPoints: {JSON.stringify(breakPoints)} */}
    //   </StyledFoo>
    // );
  }
}
