import React from 'react'
import styled from 'styled-components'

const StyledActionButton = styled.div<{
    disabled?: boolean
    minWidth?: string
    backgroundColor?: string
}>`
    min-width: ${(props) => (props.minWidth ? props.minWidth : 'min-content')};
    padding: 8px 20px;
    border: 1px solid ${(props) => props.theme.colors.secondary};
    height: 35px;
    overflow: visible;
    white-space: nowrap;
    display: flex;
    justify-content: center;
    align-items: center;
    vertical-align: middle;
    background: ${(props) =>
        props.disabled
            ? props.theme.colors.greyScale5
            : props.backgroundColor ?? props.theme.colors.secondary};

    box-sizing: border-box;
    border-radius: ${(props) => props.theme.borderRadii.default};
    cursor: pointer;

    &:focus {
        outline: unset;
    }

    &: hover {
        opacity: 0.8;
    }
`

const StyledActionLinkText = styled.div`
    font-family: ${(props) => props.theme.fonts.primary};
    font-weight: 'bold';
    font-size: ${(props) => props.theme.fontSizes.text};
    line-height: ${(props) => props.theme.lineHeights.text};
    color: ${(props) => props.theme.colors.prime1};
    text-align: center;
    overflow: visible;
    white-space: nowrap;
    display: flex;
    justify-content: center;
    align-items: center;
`

export const PrimaryActionButton = ({
    label,
    onClick,
    disabled,
    innerRef,
    minWidth,
}: {
    label: React.ReactNode
    onClick: () => void
    disabled?: boolean
    innerRef?: any
    minWidth?: string
}) => (
    <StyledActionButton
        minWidth={minWidth}
        tabIndex={0}
        onClick={disabled === true ? undefined : onClick}
        disabled={disabled}
        ref={innerRef}
        onKeyPress={(e) => (e.key === 'Enter' ? onClick() : false)}
    >
        <StyledActionLinkText>{label}</StyledActionLinkText>
    </StyledActionButton>
)

const StyledSecondaryActionButton = styled(StyledActionButton)`
    border: none;
`

export const SecondaryActionButton = ({
    label,
    onClick,
    disabled,
    innerRef,
    minWidth,
}: {
    label: React.ReactNode
    onClick: () => void
    disabled?: boolean
    innerRef?: any
    minWidth?: string
}) => (
    <StyledSecondaryActionButton
        minWidth={minWidth}
        tabIndex={0}
        backgroundColor="transparent"
        onClick={disabled === true ? undefined : onClick}
        disabled={disabled}
        ref={innerRef}
        onKeyPress={(e) => (e.key === 'Enter' ? onClick() : false)}
    >
        <StyledActionLinkText>{label}</StyledActionLinkText>
    </StyledSecondaryActionButton>
)
