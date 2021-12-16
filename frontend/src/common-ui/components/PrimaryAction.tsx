import React from 'react'
import styled from 'styled-components'
import {
    colorDisabled,
    colorPrimary,
} from '../components/design-library/colors'
import {
    fontSizeSmall,
    TypographyActionText,
} from '../components/design-library/typography'

const StyledPrimaryAction = styled.div`
    padding: 8px 20px;
    height: 35px;
    overflow: visible;
    white-space: nowrap;
    display: flex;
    justify-content: center;
    align-items: center;
    vertical-align: middle;
    background: ${(props) => props.theme.colors.purple};
    box-sizing: border-box;
    border-radius: 5px;
    cursor: pointer;

    :focus {
        outline: unset;
    }

    &: hover {
        opacity: 0.8;
    }
`

const StyledPrimaryActionLinkText = styled(TypographyActionText)`
    font-size: ${fontSizeSmall}px;
    color: white;
`
export const PrimaryAction = ({
    label,
    onClick,
    disabled,
    innerRef,
}: {
    label: React.ReactNode
    onClick: React.MouseEventHandler
    disabled?: boolean
    innerRef?: any
}) => (
    <StyledPrimaryAction
        tabIndex={0}
        onClick={onClick}
        ref={innerRef}
        onKeyPress={(e) => (e.key === 'Enter' ? onClick(e) : false)}
    >
        <StyledPrimaryActionLinkText>{label}</StyledPrimaryActionLinkText>
    </StyledPrimaryAction>
)
