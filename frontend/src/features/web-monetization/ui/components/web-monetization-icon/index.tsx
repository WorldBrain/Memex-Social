import React from 'react'
import styled from 'styled-components'
import { MemexTheme } from '@worldbrain/memex-common/lib/common-ui/styles/types'
import Icon, { IconProps } from '../../../../../common-ui/components/icon'
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

const StyledIcon = styled(Icon)<IconProps & { isClickable: boolean }>`
    ${(props) => !props.onClick && `cursor: auto`}
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

    private get isClickable(): boolean {
        return (
            this.state.isMonetizationAvailable &&
            this.state.paymentState !== 'success'
        )
    }

    private handleClick = () => {
        if (this.isClickable) {
            this.processEvent('makeSupporterPayment', null)
        }
    }

    renderIcon() {
        const { paymentState } = this.state

        return (
            <IconContainer iconHeight={this.iconHeight}>
                {paymentState === 'running' && <LoadingScreen />}
                {paymentState === 'error' && <span>Error!</span>}
                {paymentState === 'pristine' && (
                    <StyledIcon
                        isClickable={this.isClickable}
                        onClick={this.handleClick}
                        height={this.iconHeight}
                        color="secondary"
                        icon={'webMonetizationLogo'}
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
