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
    margin-left: auto;
`

type WebMonetizationIconDependencies = WebMonetizationButtonDependencies
type WebMonetizationIconState = WebMonetizationButtonState
type WebMonetizationIconEvent = WebMonetizationButtonEvent

export default class WebMonetizationIcon extends UIElement<
    WebMonetizationIconDependencies,
    WebMonetizationIconState,
    WebMonetizationIconEvent
> {
    private iconHeight = '40px'

    constructor(props: WebMonetizationIconDependencies) {
        super(props, { logic: new Logic(props) })
    }

    handleClick: React.MouseEventHandler = () => {
        this.processEvent('makeSupporterPayment', null)
    }

    render() {
        return (
            <Container>
                {this.state.isDisplayed &&
                    this.state.initialLoadTaskState === 'running' && (
                        <LoadingScreen />
                    )}
                {this.state.isDisplayed &&
                    this.state.initialLoadTaskState === 'success' && (
                        <CuratorSupportPopupContainer
                            services={this.props.services}
                            storage={this.props.storage}
                            userRef={this.props.curatorUserRef}
                        >
                            {(this.state.makePaymentTaskState === 'pristine' ||
                                this.state.makePaymentTaskState ===
                                    'success') && (
                                <Icon
                                    onClick={this.handleClick}
                                    height={this.iconHeight}
                                    fileName={`web-monetization-logo${
                                        this.state.paymentMade
                                            ? '-confirmed'
                                            : ''
                                    }.svg`}
                                />
                            )}
                            {this.state.makePaymentTaskState === 'error' && (
                                <span>Whoops! Error!</span>
                            )}
                        </CuratorSupportPopupContainer>
                    )}
            </Container>
        )
    }
}
