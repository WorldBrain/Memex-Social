import React from 'react'
import styled from 'styled-components'
import Icon from '../../../../../common-ui/components/icon'
import { UIElement } from '../../../../../main-ui/classes'

import Logic from './logic'
import {
    WebMonetizationButtonDependencies,
    WebMonetizationButtonState,
    WebMonetizationButtonEvent,
} from '../../../logic/buttons/types'
import CuratorSupportPopupContainer from '../../../../user-management/ui/containers/curator-support-popup-container'
import LoadingScreen from '../../../../../common-ui/components/loading-screen'

const Container = styled.div`
    margin-left: 10px;
    margin-right: 10px;
`

const IconContainer = styled.div<{ iconHeight: string }>`
    height: ${(props) => props.iconHeight};
    width: ${(props) => props.iconHeight};
`

const StyledIcon = styled(Icon)<{
    isClickable: boolean
}>`
    ${(props) => !props.isClickable && `cursor: auto`}
`

type WebMonetizationIconDependencies = WebMonetizationButtonDependencies
type WebMonetizationIconState = WebMonetizationButtonState
type WebMonetizationIconEvent = WebMonetizationButtonEvent

export default class WebMonetizationIcon extends UIElement<
    WebMonetizationIconDependencies,
    WebMonetizationIconState,
    WebMonetizationIconEvent
> {
    private iconHeight = '34px'

    constructor(props: WebMonetizationIconDependencies) {
        super(props, { logic: new Logic(props) })
    }

    handleClick: React.MouseEventHandler = () => {
        this.processEvent('makeSupporterPayment', null)
    }

    renderIcon() {
        const paymentState = this.state.paymentState
        const isPaymentMade = this.state.paymentState === 'success'

        return (
            <IconContainer iconHeight={this.iconHeight}>
                {paymentState === 'running' && <LoadingScreen />}
                {paymentState === 'error' && <span>Whoops! Error!</span>}
                {(paymentState === 'pristine' ||
                    paymentState === 'success') && (
                    <StyledIcon
                        onClick={isPaymentMade ? () => {} : this.handleClick}
                        height={this.iconHeight}
                        isClickable={!isPaymentMade}
                        fileName={`web-monetization-logo${
                            isPaymentMade ? '-confirmed' : ''
                        }.svg`}
                    />
                )}
            </IconContainer>
        )
    }

    render() {
        return (
            <Container>
                {this.state.isDisplayed &&
                    this.state.loadState === 'running' && <LoadingScreen />}
                {this.state.isDisplayed && this.state.loadState === 'success' && (
                    <CuratorSupportPopupContainer
                        services={this.props.services}
                        storage={this.props.storage}
                        userRef={this.props.curatorUserRef}
                        paymentMade={this.state.paymentMade}
                        paymentState={this.state.paymentState}
                        isMonetizationAvailable={
                            this.state.isMonetizationAvailable
                        }
                    >
                        {this.renderIcon()}
                    </CuratorSupportPopupContainer>
                )}
            </Container>
        )
    }
}
