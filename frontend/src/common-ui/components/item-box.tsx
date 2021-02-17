import React from 'react'
import styled from 'styled-components'

export type ItemBoxVariant = 'new-item'

const StyledItemBox = styled.div<{ variant?: ItemBoxVariant }>`
    font-family: ${(props) => props.theme.fonts.primary};
    background: #ffffff;
    border: ${(props) =>
        props.variant === 'new-item'
            ? '3px solid rgba(92, 217, 166, 0.98);'
            : '1px solid rgba(0, 0, 0, 0.1)'};
    box-sizing: border-box;
    box-shadow: 0px 1px 5px rgba(0, 0, 0, 0.2);
    border-radius: 5px;
    text-decoration: none;
    width: 100%;
`

export default function ItemBox(props: {
    children: React.ReactNode
    variant?: ItemBoxVariant
}) {
    return (
        <StyledItemBox variant={props.variant}>{props.children}</StyledItemBox>
    )
}
