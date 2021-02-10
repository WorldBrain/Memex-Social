import React, { Component } from 'react'
import Icon from '../../../../../common-ui/components/icon'
import { UIElement } from '../../../../../main-ui/classes'
import {
    WebMonetizationButtonDependencies,
    WebMonetizationButtonState,
    WebMonetizationButtonEvent,
} from '../../../logic/buttons/types'

type WebMonetizationIconDependencies = WebMonetizationButtonDependencies
type WebMonetizationIconState = WebMonetizationButtonState
type WebMonetizationIconEvent = WebMonetizationButtonEvent

export default class WebMonetizationIcon extends UIElement<
    WebMonetizationIconDependencies,
    WebMonetizationIconState,
    WebMonetizationIconEvent
> {
    handleClick: React.MouseEventHandler = () => {
        this.processEvent('makeSupporterPayment', null)
    }

    render() {
        return (
            <Icon
                onClick={this.handleClick}
                height="20px"
                fileName={`web-monetization-logo${
                    this.state.paymentMade ? '-confirmed' : ''
                }.svg`}
            />
        )
    }
}
