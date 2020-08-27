import React from "react";
import styled from "styled-components";

const StyledSmallButton = styled.div`
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

export default function SmallButton(props: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <StyledSmallButton onClick={props.onClick}>
      {props.children}
    </StyledSmallButton>
  );
}
