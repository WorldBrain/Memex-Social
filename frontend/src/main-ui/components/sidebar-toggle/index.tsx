import React from 'react'
import styled from 'styled-components'
import { Margin } from 'styled-components-spacing'
import Icon from '../../../common-ui/components/icon'
import { ViewportBreakpoint } from '../../styles/types'

const Container = styled(Margin)<{
    viewportWidth: ViewportBreakpoint
    isSidebarDisplayed: boolean
}>`
    display: block;
    margin-top: auto;
    margin-bottom: auto;
    ${(props) =>
        props.isSidebarDisplayed &&
        `
        transform: rotate(90deg);
        transition: transform 0.2s;
        position: absolute;
        top: 20px;
        left: 20px;
    `}
    ${(props) =>
        !props.isSidebarDisplayed &&
        `
        transform: rotate(0deg);
        transition: transform 0.2s;
    `}
`

const ListsSidebarToggle = (props: {
    viewportWidth: ViewportBreakpoint
    onToggle: React.MouseEventHandler
    isShown: boolean
}) => {
    return (
        <Container
            right="medium"
            viewportWidth={props.viewportWidth}
            isSidebarDisplayed={props.isShown}
        >
            <Icon
                onClick={props.onToggle as any}
                icon="hamburger"
                height="20px"
                padding="5px"
            />
        </Container>
    )
}

export default ListsSidebarToggle
