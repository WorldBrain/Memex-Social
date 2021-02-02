import React, { useState } from "react";
import { InputHTMLAttributes } from "react";
import styled from "styled-components";

import { Theme } from '../../main-ui/styles/types'
import { theme } from '../../main-ui/styles/theme'

import { USER_PROFILE_BIO_CHAR_LIMIT } from '../../constants'

import { StyledInputLabel } from './text-input'

const Container = styled.div`
    display: flex;
    flex-direction: column;
`
const StyledTextArea = styled.textarea<{
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

const CharCount = styled.div<{
    theme: Theme
}>`
  width: 100%;
  font-family: ${(props) => props.theme.fonts.primary};
  font-weight: ${(props) => props.theme.fontWeights.bold};
  font-size: ${(props) => props.theme.fontSizes.text};
  line-height: ${(props) => props.theme.lineHeights.text};
  text-align: right;
`

export default function TextArea(
    props: InputHTMLAttributes<HTMLTextAreaElement> & {
      onConfirm?(): void
      label?: string
    }
  ) {
    const [charCount, setCharCount] = useState(0)
    const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = (evt) => {
        if (props.onChange) {
            props.onChange(evt)
        }
        setCharCount(evt.currentTarget.value.length)
    }
    const renderElement = function(padding?: boolean) {
      return (
        <Container>
            <StyledTextArea
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => handleChange(event)}
            padding={padding}
            theme={theme}
            {...props}
            onKeyDown={(event: React.KeyboardEvent<HTMLTextAreaElement>) => {
                if (props.onConfirm && event.keyCode === 13) {
                return props.onConfirm();
                }
                props.onKeyDown?.(event);
            }}
            />
            <CharCount theme={theme}>{`${charCount}/${USER_PROFILE_BIO_CHAR_LIMIT}`}</CharCount>
        </Container>
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
  