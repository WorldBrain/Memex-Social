import React from "react";
import { InputHTMLAttributes } from "react";
import styled from "styled-components";

const StyledInput = styled.input`
  font-family: ${(props) => props.theme.fonts.primary};
  background: ${(props) => props.theme.colors.grey};
  border: 0;
  border-radius: 3px;
  padding: 10px;
`;

export default function TextInput(
  props: InputHTMLAttributes<HTMLInputElement>
) {
  return <StyledInput type="text" {...props} />;
}
