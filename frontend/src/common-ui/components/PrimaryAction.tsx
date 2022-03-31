import React from 'react'
import styled from 'styled-components'
import { TypographyActionText } from '../components/design-library/typography'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import {
    IconKeys,
    ColorThemeKeys,
} from '@worldbrain/memex-common/lib/common-ui/styles/types'

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
    grid-gap: 5px;

    :focus {
        outline: unset;
    }

    &: hover {
        opacity: 0.8;
    }

    & * {
        cursor: pointer;
    }
`

const StyledPrimaryActionLinkText = styled(TypographyActionText)`
    font-size: 14px;
    color: white;
`
export const PrimaryAction = ({
    label,
    onClick,
    disabled,
    innerRef,
    fontSize,
    icon,
    iconSize,
    iconColor,
    iconHoverOff,
}: {
    label: React.ReactNode
    onClick: React.MouseEventHandler
    disabled?: boolean
    innerRef?: any
    fontSize?: string
    icon?: IconKeys
    iconSize?: string
    iconColor?: ColorThemeKeys
    iconHoverOff?: boolean
}) => (
    <StyledPrimaryAction
        tabIndex={0}
        onClick={onClick as any}
        ref={innerRef}
        onKeyPress={(e) => (e.key === 'Enter' ? onClick(e as any) : false)}
    >
        {icon && (
            <Icon
                icon={icon}
                heightAndWidth={iconSize}
                color={iconColor ? iconColor : 'white'}
                hoverOff={iconHoverOff}
            />
        )}
        <StyledPrimaryActionLinkText>{label}</StyledPrimaryActionLinkText>
    </StyledPrimaryAction>
)
