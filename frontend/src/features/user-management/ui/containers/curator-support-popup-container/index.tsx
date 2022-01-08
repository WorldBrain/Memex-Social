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
import { UITaskState } from '../../../../../main-ui/types'

const Container = styled.div`
    height: min-content;
    width: min-content;
    position: relative;
`

const CuratorPopupBox = styled.div`
    top: 10px;
    position: relative;
    z-index: 10;
    position: relative;
    z-index: 10;
    height: 50px;
    padding-top: 50px;
    margin-top: -50px;
`

export type CuratorSupportPopupContainerDependencies = ProfilePopupContainerDependencies & {
    paymentMade: boolean
    paymentState: UITaskState
    isMonetizationAvailable: boolean
}
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
                <Container onMouseEnter={() => this.handleMouseEnter()}>
                    {props.children}
                    {state.isDisplayed &&
                        userPublicProfile?.paymentPointer &&
                        props.userRef && (
                            <CuratorPopupBox>
                                <CuratorSupportPopup
                                    loadState={loadState}
                                    curatorUserRef={props.userRef}
                                    services={props.services}
                                    storage={props.storage}
                                    paymentMade={props.paymentMade}
                                    paymentSate={props.paymentState}
                                    isMonetizationAvailable={
                                        props.isMonetizationAvailable
                                    }
                                />
                            </CuratorPopupBox>
                        )}
                </Container>
            </>
        )
    }
}
