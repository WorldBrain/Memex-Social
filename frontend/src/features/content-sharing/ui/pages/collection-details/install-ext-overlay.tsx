import React from 'react'
import styled, { css } from 'styled-components'
import Overlay from '../../../../../main-ui/containers/overlay'
import { ViewportBreakpoint } from '../../../../../main-ui/styles/types'
import { UIElementServices } from '../../../../../services/types'

const Content = styled.div<{
    viewportBreakpoint: ViewportBreakpoint
}>`
    max-width: 800px;
    min-width: 70%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    padding: 40px;

    > * {
        font-family: ${(props) => props.theme.fonts.primary};
    }

    ${(props) =>
        props.viewportBreakpoint === 'small' &&
        css`
            max-width: 90%;
        `}
    ${(props) =>
        props.viewportBreakpoint === 'mobile' &&
        css`
            max-width: 90%;
        `}
`

export default function InstallExtOverlay(props: {
    services: UIElementServices<'overlay'>
    viewportBreakpoint: ViewportBreakpoint
    onCloseRequested: () => void
}) {
    return (
        <Overlay
            services={props.services}
            onCloseRequested={props.onCloseRequested}
        >
            <Content viewportBreakpoint={props.viewportBreakpoint}>
                Install the ext...
            </Content>
        </Overlay>
    )
}
