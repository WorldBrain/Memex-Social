import React from 'react'
import styled, { css } from 'styled-components'

interface StyledButtonProps {
    type: 'primary-action' | 'small' | 'alternative-small'
    isDisabled?: boolean
}

const VARIATIONS: {
    [Key in StyledButtonProps['type']]: ReturnType<typeof css>
} = {
    'primary-action': css`
        padding: 10px 10px;
        font-size: 14px;
    `,
    small: css`
        padding: 3px 10px;
        font-size: 12px;
    `,
    'alternative-small': css`
        background-color: none !important;
        padding: 3px 10px;
        font-size: 12px;
    `,
}

const StyledButton = (props: StyledButtonProps) => css`
    ${VARIATIONS[props.type]}
    display: block;
    font-family: ${(props) => props.theme.fonts.primary};
    padding: ${props.type === 'primary-action' ? '10px' : '3px'} 20px;
    text-align: center;
    font-weight: 500;
    background-color: #5cd9a6;
    border-radius: 3px;
    color: ${(props) => props.theme.colors.primary};
    background-color: ${(props) => props.theme.colors.secondary};
    cursor: ${props.isDisabled ? 'not-allowed' : 'pointer'};
    white-space: nowrap;
    text-decoration: none;

    &:hover {
        opacity: 0.8;
    }
`

const ButtonWithOnClick = styled.div<StyledButtonProps>`
    ${(props) => StyledButton(props)}
`

const ButtonWithLink = styled.a<StyledButtonProps>`
    ${(props) => StyledButton(props)}
`

export default function Button(
    props: StyledButtonProps & {
        children: React.ReactNode
    } & (
            | {
                  onClick?: () => void
              }
            | {
                  externalHref: string
              }
        ),
) {
    const handleClick: React.MouseEventHandler = (e) => {
        if ('externalHref' in props) {
            if (props.isDisabled) {
                e.preventDefault()
            }
            return
        }

        if (!props.isDisabled) {
            props.onClick?.()
            return
        }
    }

    return (
        <>
            {'externalHref' in props && (
                <ButtonWithLink
                    type={props.type}
                    onClick={handleClick}
                    href={props.externalHref}
                    target="_blank"
                >
                    {props.children}
                </ButtonWithLink>
            )}
            {!('externalHref' in props) && (
                <ButtonWithOnClick type={props.type} onClick={handleClick}>
                    {props.children}
                </ButtonWithOnClick>
            )}
        </>
    )
}
