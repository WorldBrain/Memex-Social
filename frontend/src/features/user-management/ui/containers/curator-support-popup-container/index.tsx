import React from 'react'
import styled from 'styled-components'

import { UIElement } from '../../../../../main-ui/classes'
import CuratorSupportPopupContainerLogic from './logic'
import {
    ProfilePopupContainerDependencies,
    ProfilePopupContainerState,
    ProfilePopupContainerEvent,
} from '../profile-popup-container/types'

import CuratorSupportPopup from '../../components/curator-support-popup'

const Container = styled.div`
    height: min-content;
    width: min-content;
    position: relative;
`

// const CuratorPopupBox = styled.div`
//     padding-top: 5px;
// `

export type CuratorSupportPopupContainerDependencies = ProfilePopupContainerDependencies
export type CuratorSupportPopupContainerState = ProfilePopupContainerState
export type CuratorSupportPopupContainerEvent = ProfilePopupContainerEvent

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
        const { loadState, userPublicProfile } = this.state
        const { props, state } = this
        return (
            <>
                <Container
                    onMouseEnter={() => this.handleMouseEnter()}
                    onMouseLeave={() => this.handleMouseLeave()}
                >
                    {props.children}
                    {state.isDisplayed &&
                        userPublicProfile?.paymentPointer &&
                        props.userRef && (
                            <CuratorSupportPopup
                                taskState={loadState}
                                curatorUserRef={props.userRef}
                                services={props.services}
                                storage={props.storage}
                            />
                        )}
                </Container>
            </>
        )
    }
}
