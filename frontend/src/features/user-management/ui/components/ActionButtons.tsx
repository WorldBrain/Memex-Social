import React from 'react'
import styled from 'styled-components'
import { theme } from '../../../../main-ui/styles/theme'
import { Theme } from '../../../../main-ui/styles/types'

const StyledActionButton = styled.div<{ 
    theme: Theme
    disabled: boolean | undefined
    minWidth: string | undefined
    backgroundColor: string
}>`
    min-width: ${props => props.minWidth ? props.minWidth : 'min-content'};
    padding: 8px 20px;
    border: 1px solid ${props => props.theme.colors.secondary};
    height: 35px;
    overflow: visible;
    white-space: nowrap;
    display: flex;
    justify-content: center;
    align-items: center;
    vertical-align: middle;
    background: ${(props) => (props.disabled ? props.theme.colors.lightgrey : props.backgroundColor)};

    box-sizing: border-box;
    border-radius: ${props => props.theme.borderRadii.default};
    cursor: pointer;

    &:focus {
        outline: unset;
    }

    &: hover {
        opacity: 0.8;
    }
`

const StyledActionLinkText = styled.div<{ theme: Theme }>`
    font-family: ${props => props.theme.fonts.primary};
    font-weight: ${props => props.theme.fontWeights.bold};
    font-size: ${props => props.theme.fontSizes.text};
    line-height: ${props => props.theme.lineHeights.text};
    color: ${props => props.theme.colors.primary};
    text-align: center;
    overflow: visible;
    white-space: nowrap;
    display: flex;
    justify-content: center;
    align-items: center
`

export const PrimaryActionButton = ({
    label, 
    onClick,
    disabled,
    innerRef,
    minWidth
}: {
    label: React.ReactNode
    onClick: () => void
    disabled?: boolean
    innerRef?: any
    minWidth?: string
}) => (
    <StyledActionButton
        minWidth={minWidth}
        theme={theme}
        backgroundColor={theme.colors.secondary}
        tabIndex={0}
        onClick={disabled === true ? undefined : onClick}
        disabled={disabled}
        ref={innerRef}
        onKeyPress={(e) => (e.key === 'Enter' ? onClick() : false)}
    >
        <StyledActionLinkText>{label}</StyledActionLinkText>
    </StyledActionButton>
)

export const SecondaryActionButton = ({
    label, 
    onClick,
    disabled,
    innerRef,
    minWidth
}: {
    label: React.ReactNode
    onClick: () => void
    disabled?: boolean
    innerRef?: any
    minWidth?: string
}) => (
    <StyledActionButton
        minWidth={minWidth}
        theme={theme}
        backgroundColor={"transparent"}
        tabIndex={0}
        onClick={disabled === true ? undefined : onClick}
        disabled={disabled}
        ref={innerRef}
        onKeyPress={(e) => (e.key === 'Enter' ? onClick() : false)}
    >
        <StyledActionLinkText>{label}</StyledActionLinkText>
    </StyledActionButton>
)
