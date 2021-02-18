import React from 'react'
import styled from 'styled-components'
import { Margin } from 'styled-components-spacing'
import Icon from '../../../common-ui/components/icon'
import { ViewportBreakpoint } from '../../styles/types'
import { SidebarToggleProps } from './types'

const Container = styled(Margin)<{
    viewportWidth: ViewportBreakpoint
    isSidebarDisplayed: boolean
}>`
    display: ${(props) =>
        props.viewportWidth === 'mobile' || props.viewportWidth === 'small'
            ? 'block'
            : 'none'};
    margin-top: auto;
    margin-bottom: auto;
    ${(props) =>
        props.isSidebarDisplayed &&
        `
        transform: rotate(90deg);
        transition: transform 0.2s;
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
    isShown: boolean
    onToggle: (newShownValue: boolean) => void
}) => {
    return (
        <Container
            horizontal="medium"
            viewportWidth={props.viewportWidth}
            isSidebarDisplayed={props.isShown}
        >
            <Icon
                onClick={() => props.onToggle(!props.isShown)}
                fileName="hamburger.svg"
                height="30px"
            />
        </Container>
    )
}

export default ListsSidebarToggle
