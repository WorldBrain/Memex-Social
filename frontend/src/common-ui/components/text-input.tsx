import React from "react";
import { InputHTMLAttributes } from "react";
import styled from "styled-components";

import { theme } from '../../main-ui/styles/theme'
import { Theme } from '../../main-ui/styles/types'

const StyledInput = styled.input<{
  theme: Theme
  padding?: boolean
}>`
  font-family: ${(props) => props.theme.fonts.primary};
  background: ${(props) => props.theme.colors.grey};
  border: 0;
  border-radius: ${props => props.theme.borderRadii.default};
  ${props => props.padding ? 'padding: 10px;' : '' // hacky workaround as this component is already used in several places
}; 
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

export default function TextInput(
  props: InputHTMLAttributes<HTMLInputElement> & {
    onConfirm?(): void
    label?: string
  }
) {
  const renderElement = function(padding?: boolean) {
    return (
        <StyledInput
        padding={padding}
        type="text"
        theme={theme}
        {...props}
        onKeyDown={(event) => {
          if (props.onConfirm && event.keyCode === 13) {
            return props.onConfirm();
          }
          props.onKeyDown?.(event);
        }}
      />
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
