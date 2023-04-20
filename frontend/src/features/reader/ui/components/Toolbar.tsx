import React from 'react'
import styled from 'styled-components'

export function Toolbar() {
    return (
        <ToolbarWrapper>
            <p>Example text</p>
        </ToolbarWrapper>
    )
}

export const ToolbarWrapper = styled.div`
    height: 80px;
    width: 100%;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background-color: #333333;
    z-index: 9999;
`
