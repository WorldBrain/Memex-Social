import React from "react";
import { InputHTMLAttributes } from "react";
import styled from "styled-components";

import { theme } from '../../main-ui/styles/theme'
import { Theme } from '../../main-ui/styles/types'

const StyledInput = styled.input<{
  theme: Theme
  padding?: boolean
  error?: boolean
}>`
  font-family: ${(props) => props.theme.fonts.primary};
  background: ${(props) => props.theme.colors.grey};
  border: 0;
  border-radius: ${props => props.theme.borderRadii.default};
  ${props => props.padding ? 'padding: 10px;' : ''}
  ${props => props.error && 'border: solid 2px red;'}
`

export const StyledInputLabel = styled.div<{
  theme: Theme
}>`
  font-family: ${(props) => props.theme.fonts.primary};
  font-weight: ${(props) => props.theme.fontWeights.bold};
  font-size: ${(props) => props.theme.fontSizes.text};
  line-height: ${(props) => props.theme.lineHeights.text};
  color: ${props => props.theme.colors.primary};
`

export const ErrorMessage = styled.div<{
  theme: Theme
}>`
  font-family: ${props => props.theme.fonts.primary};
  font-size: ${props => props.theme.fontSizes.smallText};
  line-height: ${props => props.theme.lineHeights.smallText};
  color: ${props => props.theme.colors.warning};
`

export default function TextInput(
  props: InputHTMLAttributes<HTMLInputElement> & {
    onConfirm?(): void
    label?: string
    error?: boolean
    errorMessage?: string
  }
) {
  const renderElement = function(padding?: boolean) {
    return (
      <>
        <StyledInput
        padding={padding}
        type="text"
        theme={theme}
        {...props}
        error={props.error}
        onKeyDown={(event) => {
          if (props.onConfirm && event.keyCode === 13) {
            return props.onConfirm();
          }
          props.onKeyDown?.(event);
        }}
      />
      {props.error && props.errorMessage && <ErrorMessage theme={theme}>{props.errorMessage}</ErrorMessage>}
    </>
    )
  }
  if(!props.label) {
    return (
      renderElement(true)
      )
  } else {
    return (
      <>
        <StyledInputLabel>
          {props.label}
        </StyledInputLabel>
        {renderElement()}
      </>
    )
  }
}
