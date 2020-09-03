import React from "react";
import styled, { css } from "styled-components";

const StyledSmallButton = css`
  display: block;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 500;
  background-color: #5cd9a6;
  border-radius: 3px;
  color: ${(props) => props.theme.colors.primary};
  background-color: ${(props) => props.theme.colors.secondary};
  cursor: pointer;
  white-space: nowrap;
  text-decoration: none;

  &:hover {
    opacity: 0.8;
  }
`;

const SmallButtonWithOnClick = styled.div`
  ${StyledSmallButton}
`;

const SmallButtonWithLink = styled.a`
  ${StyledSmallButton}
`;

export default function SmallButton(
  props: {
    children: React.ReactNode;
  } & (
    | {
        onClick?: () => void;
      }
    | {
        externalHref: string;
      }
  )
) {
  return (
    <>
      {"externalHref" in props && (
        <SmallButtonWithLink href={props.externalHref} target="_blank">
          {props.children}
        </SmallButtonWithLink>
      )}
      {!("externalHref" in props) && (
        <SmallButtonWithOnClick onClick={props.onClick}>
          {props.children}
        </SmallButtonWithOnClick>
      )}
    </>
  );
}
