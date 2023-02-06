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
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'

const Container = styled.div`
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
    iconRef = React.createRef<HTMLDivElement>()

    constructor(props: WebMonetizationIconDependencies) {
        super(props, { logic: new Logic(props) })
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
            <IconContainer onClick={() => this.processEvent('showPopup', null)}>
                {paymentState === 'pristine' && (
                    <WebMonetizationPaymentProgress>
                        <Icon
                            height={'24px'}
                            color="white"
                            icon={'webMonetizationLogo'}
                            onClick={this.handleClick}
                        />
                    </WebMonetizationPaymentProgress>
                )}
                {paymentState === 'success' && (
                    <WebMonetizationPaymentProgress>
                        <Icon
                            height={'24px'}
                            color="prime1"
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
            <Container ref={this.iconRef}>
                <TooltipBox
                    placement="bottom"
                    tooltipText={
                        <span>
                            Support the Curator <br />
                            of this Space
                        </span>
                    }
                    targetElementRef={this.iconRef.current ?? undefined}
                >
                    {this.renderIcon()}
                </TooltipBox>
                {this.state.isDisplayed === true && (
                    <PopoutBox
                        placement="bottom"
                        strategy="fixed"
                        targetElementRef={this.iconRef.current ?? undefined}
                        closeComponent={() =>
                            this.processEvent('hidePopup', null)
                        }
                        offsetX={10}
                    >
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
                    </PopoutBox>
                )}
            </Container>
        )
    }
}
