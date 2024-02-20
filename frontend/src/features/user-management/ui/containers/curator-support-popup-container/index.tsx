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
import { UserReference } from '../../../types'

export type CuratorSupportPopupContainerDependencies = Omit<
    ProfilePopupContainerDependencies,
    'userRef'
> & {
    paymentMade: boolean
    paymentState: UITaskState
    isMonetizationAvailable: boolean
    userRef: UserReference
    onMouseLeave?: () => void
    getRootElement: () => HTMLElement
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

    async componentDidMount() {
        await super.componentDidMount()
        await this.processEvent('initPopup', null)
    }

    handleMouseEnter() {
        this.processEvent('initPopup', null)
    }

    render() {
        const { loadState } = this.state
        const { props } = this

        return (
            <CuratorSupportPopup
                loadState={loadState}
                curatorUserRef={props.userRef}
                services={props.services}
                paymentMade={props.paymentMade}
                paymentState={props.paymentState}
                isMonetizationAvailable={props.isMonetizationAvailable}
                getRootElement={props.getRootElement}
            />
        )
    }
}
