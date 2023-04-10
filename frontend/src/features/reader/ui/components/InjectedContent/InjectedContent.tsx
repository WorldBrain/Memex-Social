import React from 'react'
import styled from 'styled-components'

const InjectedContentWrapper = styled.div`
    max-width: 100%;
    width: calc(100% - 300px);
    height: calc(100% - 80px);
    position: fixed;
    background-color: #000;
    top: 80px;
    left: 0;
    bottom: 0;
`

const InjectedContent = () => <InjectedContentWrapper id="web-reader-root" />

export default InjectedContent
