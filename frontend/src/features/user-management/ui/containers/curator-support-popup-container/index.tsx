import React from 'react'
import styled from 'styled-components'

import { UIElement } from '../../../../../main-ui/classes'
import CuratorSupportPopupContainerLogic, {
    CuratorSupportPopupContainerDependencies,
    CuratorSupportPopupContainerState,
    CuratorSupportPopupContainerEvent,
} from './logic'

import CuratorSupportPopup from '../../components/curator-support-popup'

const Container = styled.div`
    height: 'min-content';
    width: 'min-content';
    position: relative;
`

export default class CuratorSupportPopupContainer extends UIElement<
    CuratorSupportPopupContainerDependencies,
    CuratorSupportPopupContainerState,
    CuratorSupportPopupContainerEvent
> {
    constructor(props: CuratorSupportPopupContainerDependencies) {
        super(props, { logic: new CuratorSupportPopupContainerLogic(props) })
    }

    handleMouseEnter() {
        this.processEvent('initPopup', null)
    }

    handleMouseLeave() {
        this.processEvent('hidePopup', null)
    }

    render() {
        const { profileTaskState, profileData } = this.state
        return (
            <>
                <Container
                    onMouseEnter={this.handleMouseEnter}
                    onMouseLeave={this.handleMouseLeave}
                >
                    {this.props.children}
                </Container>
                {this.state.isDisplayed && (
                    <CuratorSupportPopup
                        taskState={profileTaskState}
                        paymentPointer={profileData.paymentPointer}
                        services={this.props.services}
                        storage={this.props.storage}
                    />
                )}
            </>
        )
    }
}
