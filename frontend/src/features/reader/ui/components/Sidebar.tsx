import React from 'react'
import styled from 'styled-components'

export function Sidebar() {
    return <Container />
}

export const Container = styled.div`
    height: 100%;
    width: 300px;
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    background-color: #333333;
    z-index: 9999;
`
