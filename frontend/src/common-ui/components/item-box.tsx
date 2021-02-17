import React from "react";
import styled from "styled-components";

export type ItemBoxVariant = "new-item";

const StyledItemBox = styled.div<{ variant?: ItemBoxVariant }>`
  font-family: ${(props) => props.theme.fonts.primary};
  background: #ffffff;
  box-sizing: border-box;
  box-shadow: rgba(0, 0, 0, 0.1) 0px 1px 2px 0px;
  border-radius: 5px;
  text-decoration: none;
  width: 100%;
`;

export default function ItemBox(props: {
  children: React.ReactNode;
  variant?: ItemBoxVariant;
}) {
  return (
    <StyledItemBox variant={props.variant}>{props.children}</StyledItemBox>
  );
}
