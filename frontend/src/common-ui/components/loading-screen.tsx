import React from 'react'
import styled from 'styled-components'
import LoadingIndicator from './loading-indicator'

const StyledLoadingScreen = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 100%;
`

export default function LoadingScreen() {
    return (
        <StyledLoadingScreen>
            <LoadingIndicator />
        </StyledLoadingScreen>
    )
}
