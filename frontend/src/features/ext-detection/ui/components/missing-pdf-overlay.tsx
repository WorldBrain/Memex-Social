import React from 'react'
import styled, { css } from 'styled-components'
import Overlay from '../../../../main-ui/containers/overlay'
import { ViewportBreakpoint } from '../../../../main-ui/styles/types'
import { UIElementServices } from '../../../../services/types'

export default function MissingPdfOverlay(props: {
    services: UIElementServices<'overlay'>
    viewportBreakpoint: ViewportBreakpoint
    onCloseRequested: () => void
}) {
    return (
        <Overlay
            services={props.services}
            onCloseRequested={props.onCloseRequested}
        >
            DROP PDF!!!!
        </Overlay>
    )
}
