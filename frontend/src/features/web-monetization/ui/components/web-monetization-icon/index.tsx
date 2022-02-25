import React from 'react'
import styled from 'styled-components'
import { MemexTheme } from '@worldbrain/memex-common/lib/common-ui/styles/types'
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

const IconContainer = styled.div<{ iconHeight: string }>`
    height: 30px;
    width: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
`

const StyledImg = styled.div<{
    height: string
    icon: keyof MemexTheme['icons']
}>`
    cursor: pointer;
    height: ${(props) => props.height};
    background-position: center;
    background-size: contain;
    background-repeat: no-repeat;
    background-image: url(${(props) => props.theme.icons[props.icon]});
`

const LoadingBox = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 15px;
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

const CuratorBox = styled.div`
    z-index: 1000;
`

type WebMonetizationIconDependencies = WebMonetizationButtonDependencies
type WebMonetizationIconState = WebMonetizationButtonState
type WebMonetizationIconEvent = WebMonetizationButtonEvent

export default class WebMonetizationIcon extends UIElement<
    WebMonetizationIconDependencies,
    WebMonetizationIconState,
    WebMonetizationIconEvent
> {
    private iconHeight = '20px'

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

        return (
            <IconContainer
                onMouseEnter={() => this.processEvent('showPopup', null)}
                iconHeight={this.iconHeight}
            >
                {paymentState === 'running' && (
                    <WebMonetizationPaymentProgress>
                        <Icon
                            height={'16px'}
                            color="purple"
                            icon={'webMonetizationLogo'}
                            onClick={this.handleClick}
                        />
                        <LoadingIndicator size={24} />
                    </WebMonetizationPaymentProgress>
                )}
                {paymentState === 'error' && <span>Error!</span>}
                {paymentState === 'pristine' && (
                    <Icon
                        height={this.iconHeight}
                        color="purple"
                        icon={'webMonetizationLogo'}
                        onClick={this.handleClick}
                    />
                )}
                {paymentState === 'success' && (
                    <StyledImg
                        height={this.iconHeight}
                        icon={'webMonetizationLogoConfirmed'}
                    />
                )}
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
