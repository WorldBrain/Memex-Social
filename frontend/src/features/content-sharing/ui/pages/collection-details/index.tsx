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

const middleWidth = "80%";
const middleMaxWidth = "800px";
const StyledHeader = styled.div`
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
  z-index:2;
`;
const HeaderLogoArea = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
`;

const MemexLogo = styled.div`
  height: 24px;
  background-position: center;
  background-size: contain;
  width: 100px;
  border: none;
  background-repeat: no-repeat;
  background-image: url('https://getmemex.com/static/logo-memex-0d1fa6f00a7b0e7843b94854f3b6cb39.svg');
  display: flex;
`

const HeaderMiddleArea = styled.div`
  width: ${middleWidth};
  max-width: ${middleMaxWidth};
  display: flex;
  align-items: center;
  flex: 2;
  justify-content: flex-start;
`;
const HeaderTitle = styled.div`
  font-weight: 600;
  text-overflow: ellipsis;
  overflow-x: hidden;
  overflow-wrap: break-word;
  white-space: nowrap;
  max-width: 70%;
  color: ${(props) => props.theme.colors.primary}
`;
const HeaderSubtitle = styled.div`
  margin-left: 10px;
  font-size: 15px;
  font-weight: 500;
  margin-top: 1px;
  color: ${props => props.theme.colors.subText};
`;
const HeaderCtaArea = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

const SignUp = styled.div`
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 500;
  background-color: #5cd9a6;
  border-radius: 3px;
  background-color: ${props => props.theme.colors.secondary};
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`

const PageMiddleArea = styled.div`
  margin: 0 auto;
  width: ${middleWidth};
  max-width: ${middleMaxWidth};
  top: 50px;
  position: relative;
  padding-bottom: 100px;
`;

const CollectionDescriptionBox = styled.div`
  font-family: ${(props) => props.theme.fonts.primary};
  font-size: 14px;
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;
const CollectionDescriptionText = styled.div``;
const CollectionDescriptionToggle = styled.div`
  cursor: pointer;
  padding: 3px 5px;
  margin-left: -5px;
  border-radius: ${props => props.theme.borderRadius.default};
  color: ${props => props.theme.colors.subText};

  &:hover {
    background-color: ${props => props.theme.hoverBackground.primary};
  }
`;

const PageInfoList = styled.div`
`;
const PageInfoBox = styled.div`
  font-family: ${(props) => props.theme.fonts.primary};
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
  box-shadow: 0px 1px 5px rgba(0, 0, 0, 0.2);
  border-radius: 5px;
  padding: 15px 20px;
  cursor: pointer;
`;
const PageInfoBoxTitle = styled.div`
  font-weight: 600;
  font-size: ${props => props.theme.fontSize.listTitle}
`;
const PageInfoBoxUrl = styled.div`
    font-weight: 400;
    font-size: ${props => props.theme.fontSize.url};
    color: ${props => props.theme.colors.subText}
`;

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
          <HeaderLogoArea>
              <MemexLogo/>
          </HeaderLogoArea>
          <HeaderMiddleArea>
            <HeaderTitle title={data.list.title}>{data.list.title}</HeaderTitle>
            {data.creatorDisplayName && (
              <HeaderSubtitle>by {data.creatorDisplayName}</HeaderSubtitle>
            )}
          </HeaderMiddleArea>
          <HeaderCtaArea>
            <SignUp
              onClick={()=>window.open('https://getmemex.com')}
            >Share your research</SignUp>
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
                  <Trans>▸ Show more</Trans>
                ) : (
                  <Trans>◂ Show less</Trans>
                )}
              </CollectionDescriptionToggle>
            )}
          </CollectionDescriptionBox>
          <PageInfoList>
            {data.listEntries.map((entry) => (
              <Margin key={entry.normalizedUrl} vertical="small">
                <PageInfoBox onClick={() => window.open(entry.originalUrl)}>
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
