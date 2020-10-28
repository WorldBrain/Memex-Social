import React from "react";
import styled, { css } from "styled-components";
import { ViewportBreakpoint } from "../../main-ui/styles/types";
import SmallButton from "../components/small-button";
const logoImage = require("../../assets/img/memex-logo.svg");

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

const PageMiddleArea = styled.div<{
  viewportWidth: "mobile" | "small" | "normal" | "big";
}>`
  max-width: ${middleMaxWidth};
  top: 10px;
  position: relative;
  padding-bottom: 100px;
  margin: 20px auto 0;

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

export default function DefaultPageLayout(props: {
  headerTitle?: string;
  headerSubtitle?: string | null;
  viewportBreakpoint: ViewportBreakpoint;
  children: React.ReactNode;
}) {
  const { viewportBreakpoint: viewportWidth } = props;
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
          {props.headerTitle && (
            <HeaderTitle
              title={props.headerTitle}
              viewportWidth={viewportWidth}
            >
              {props.headerTitle}
            </HeaderTitle>
          )}
          {props.headerTitle && props.headerSubtitle && (
            <HeaderSubtitle viewportWidth={viewportWidth}>
              {props.headerSubtitle}
            </HeaderSubtitle>
          )}
        </HeaderMiddleArea>
        <HeaderCtaArea viewportWidth={viewportWidth}>
          <SmallButton externalHref="https://getmemex.com">
            Share your research
          </SmallButton>
        </HeaderCtaArea>
      </StyledHeader>
      <PageMiddleArea viewportWidth={viewportWidth}>
        {props.children}
      </PageMiddleArea>
    </>
  );
}
