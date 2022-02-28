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

const CuratorPopupBox = styled.div`
    margin-left: -140px;
    margin-top: 10px;
    position: absolute;
`

export type CuratorSupportPopupContainerDependencies = ProfilePopupContainerDependencies & {
    paymentMade: boolean
    paymentState: UITaskState
    isMonetizationAvailable: boolean
    onMouseLeave?: () => void
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

    componentDidMount(): void {
        this.processEvent('initPopup', null)
    }

    handleMouseEnter() {
        this.processEvent('initPopup', null)
    }

    render() {
        const { loadState } = this.state
        const { props } = this

        return (
            <CuratorPopupBox onMouseLeave={props.onMouseLeave}>
                <CuratorSupportPopup
                    loadState={loadState}
                    curatorUserRef={props.userRef}
                    services={props.services}
                    storage={props.storage}
                    paymentMade={props.paymentMade}
                    paymentState={props.paymentState}
                    isMonetizationAvailable={props.isMonetizationAvailable}
                />
            </CuratorPopupBox>
        )
    }
}
