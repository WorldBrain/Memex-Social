import React from "react";
import styled from "styled-components";

const StyledItemBox = styled.div`
  font-family: ${(props) => props.theme.fonts.primary};
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
  box-shadow: 0px 1px 5px rgba(0, 0, 0, 0.2);
  border-radius: 5px;
  padding: 15px 20px;
  cursor: pointer;
  text-decoration: none;
`;

export default function ItemBox(props: { children: React.ReactNode }) {
  return <StyledItemBox>{props.children}</StyledItemBox>;
}
