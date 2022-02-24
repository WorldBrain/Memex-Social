import React from 'react'
import styled from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { IconProps } from '@worldbrain/memex-common/lib/common-ui/components/icon'
import {
    IconKeys,
    ColorThemeKeys,
} from '@worldbrain/memex-common/lib/common-ui/styles/types'

const StyledSecondaryAction = styled.div`
    padding: 8px 20px;
    height: 35px;
    overflow: visible;
    white-space: nowrap;
    display: flex;
    justify-content: center;
    align-items: center;
    vertical-align: middle;
    border: 1.5px solid ${(props) => props.theme.colors.purple};
    background: white;
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

const StyledSecondaryActionLinkText = styled.div<{ fontSize: string }>`
    font-size: ${(props) => (props.fontSize ? props.fontSize : '14px')};
    color: ${(props) => props.theme.colors.purple};
`
export const SecondaryAction = ({
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
    <StyledSecondaryAction
        tabIndex={0}
        onClick={onClick as any}
        ref={innerRef}
        onKeyPress={(e) => (e.key === 'Enter' ? onClick(e as any) : false)}
    >
        {icon && (
            <Icon
                icon={icon}
                heightAndWidth={iconSize}
                color={iconColor ? iconColor : 'purple'}
                hoverOff={iconHoverOff}
            />
        )}
        <StyledSecondaryActionLinkText fontSize={fontSize}>
            {label}
        </StyledSecondaryActionLinkText>
    </StyledSecondaryAction>
)
