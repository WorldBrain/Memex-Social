import React from 'react'
import styled from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { UIElement } from '../../../../../main-ui/classes'

import Logic from './logic'
import {
    WebMonetizationButtonDependencies,
    WebMonetizationButtonState,
    WebMonetizationButtonEvent,
} from '../../../logic/buttons/types'
import CuratorSupportPopupContainer from '../../../../user-management/ui/containers/curator-support-popup-container'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'

const Container = styled.div`
    margin-left: 10px;
    z-index: 10000;
`

const IconContainer = styled.div<{}>`
    height: 30px;
    width: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
`

const WebMonetizationPaymentProgress = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 15px;

    & > div {
        position: absolute;
    }
`

type WebMonetizationIconDependencies = WebMonetizationButtonDependencies
type WebMonetizationIconState = WebMonetizationButtonState
type WebMonetizationIconEvent = WebMonetizationButtonEvent

export default class WebMonetizationIcon extends UIElement<
    WebMonetizationIconDependencies,
    WebMonetizationIconState,
    WebMonetizationIconEvent
> {
    private iconHeight = '30px'

    constructor(props: WebMonetizationIconDependencies) {
        super(props, { logic: new Logic(props) })
    }

    private get isClickable(): boolean {
        return (
            this.state.isMonetizationAvailable &&
            this.state.paymentState !== 'success'
        )
    }

    handleClick = () => {
        this.processEvent('makeSupporterPayment', null)
    }

    renderIcon() {
        const { paymentState } = this.state

        if (
            this.state.paymentState === 'pristine' &&
            this.props.isFollowedSpace
        ) {
            this.handleClick()
        }

        return (
            <IconContainer
                onMouseEnter={() => this.processEvent('showPopup', null)}
            >
                {paymentState === 'pristine' && (
                    <WebMonetizationPaymentProgress>
                        <Icon
                            height={'24px'}
                            color="normalText"
                            icon={'webMonetizationLogo'}
                            onClick={this.handleClick}
                        />
                    </WebMonetizationPaymentProgress>
                )}
                {paymentState === 'success' && (
                    <WebMonetizationPaymentProgress>
                        <Icon
                            height={'24px'}
                            color="purple"
                            icon={'webMonetizationLogo'}
                            onClick={this.handleClick}
                            hoverOff
                        />
                        <LoadingIndicator speed={4} size={24} />
                    </WebMonetizationPaymentProgress>
                )}
                {paymentState === 'error' && <span>Error!</span>}
            </IconContainer>
        )
    }

    render() {
        return (
            <Container>
                {this.renderIcon()}

                {this.state.isDisplayed === true && (
                    <CuratorSupportPopupContainer
                        services={this.props.services}
                        storage={this.props.storage}
                        userRef={this.props.curatorUserRef}
                        paymentMade={this.state.paymentMade}
                        paymentState={this.state.paymentState}
                        isMonetizationAvailable={
                            this.state.isMonetizationAvailable
                        }
                        onMouseLeave={() =>
                            this.processEvent('hidePopup', null)
                        }
                    />
                )}
            </Container>
        )
    }
}
