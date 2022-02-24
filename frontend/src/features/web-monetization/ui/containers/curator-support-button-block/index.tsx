import React from 'react'
import styled from 'styled-components'

import { UIElement } from '../../../../../main-ui/classes'
import { UITaskState } from '../../../../../main-ui/types'
import { theme } from '../../../../../main-ui/styles/theme'
import { Theme } from '../../../../../main-ui/styles/types'

import CuratorSupportButtonBlockLogic from './logic'

import LoadingScreen from '../../../../../common-ui/components/loading-screen'
import {
    WebMonetizationButtonDependencies,
    WebMonetizationButtonState,
    WebMonetizationButtonEvent,
} from '../../../logic/buttons/types'
import { PrimaryAction } from '../../../../../common-ui/components/PrimaryAction'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

const Container = styled.div`
    display: flex;
    width: 100%;
    height: min-content;
    justify-content: start;
    align-items: center;
    ${(props) =>
        `margin: ${props.theme.spacing.small} ${props.theme.spacing.small} 0 0;`}
`

const Button = styled.div<{
    theme: Theme
    supportedTaskState?: UITaskState
    isSupported?: boolean
}>`
    height: 40px;
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    justify-self: center;
    ${(props) => `border: 2px solid ${props.theme.colors.secondary};`}

    ${(props) =>
        `padding: ${props.theme.spacing.small} ${props.theme.spacing.medium};`}
    ${(props) =>
        props.supportedTaskState === 'pristine' &&
        `border: 2px solid ${props.theme.colors.secondary};`}
    ${(props) =>
        props.supportedTaskState === 'running' &&
        `border: 2px solid ${props.theme.colors.secondary};`}
    ${(props) => `background-color: ${props.theme.colors.background};`}
    ${(props) =>
        (props.supportedTaskState === 'success' || props.isSupported) &&
        `background-color: ${props.theme.colors.secondary};`}
    ${(props) =>
        props.supportedTaskState === 'error' &&
        `background-color: ${props.theme.colors.warning};`}
    border-radius: 3px;

    &:hover {
        ${(props) => `background-color: ${props.theme.colors.secondary};`}
    }
`

const ButtonInnerText = styled.div<{
    theme: Theme
}>`
    color: ${(props) => props.theme.colors.primary};
    font-family: ${(props) => props.theme.fonts.primary};
    font-size: 12px;
    line-height: ${(props) => props.theme.lineHeights.text};
    text-align: center;
`

const BoldText = styled(ButtonInnerText)`
    font-weight: 700;
`

const ButtonContent = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    grid-gap: 7px;
    font-weight: normal;
    font-size: 14px;
    width: 100%;
`

// const Link = styled.div<{ theme: Theme }>`
//     ${(props) => `font-size: ${props.theme.fontSizes.text};`}
//     ${(props) => `line-height: ${props.theme.lineHeights.text};`}
//     text-decoration: underline;
//     ${(props) => `margin-left: ${props.theme.spacing.medium};`}
//     color: ${(props) => props.theme.colors.primary};
//     cursor: pointer;
// `

const ErrorMessage = styled.div<{ theme: Theme }>`
    width: 100%;
    height: min-content;
    border-radius: ${(props) => props.theme.borderRadii.default};
    background-color: ${(props) => props.theme.colors.secondary};
    display: flex;
    justify-content: center;
    align-items: center;
`

type CuratorSupportButtonBlockDependencies = WebMonetizationButtonDependencies
type CuratorSupportButtonBlockState = WebMonetizationButtonState
type CuratorSupportButtonBlockEvent = WebMonetizationButtonEvent

export class CuratorSupportButtonBlock extends UIElement<
    CuratorSupportButtonBlockDependencies,
    CuratorSupportButtonBlockState,
    CuratorSupportButtonBlockEvent
> {
    constructor(props: CuratorSupportButtonBlockDependencies) {
        super(props, { logic: new CuratorSupportButtonBlockLogic(props) })
    }

    handleButtonClick: React.MouseEventHandler = () => {
        this.processEvent('makeSupporterPayment', null)
    }

    handleWebLinkClick = (url: string): void => {
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
        if (newWindow) newWindow.opener = null
    }

    renderErrorScreen() {
        return (
            <Container>
                <ErrorMessage theme={theme}>
                    Something went wrong. Please refresh your browser.
                </ErrorMessage>
            </Container>
        )
    }

    renderLoadingSceen() {
        return (
            <Container>
                <LoadingScreen />
            </Container>
        )
    }

    renderButtonInnerHTML() {
        const { paymentState } = this.state
        if (paymentState === 'running') {
            return <LoadingScreen />
        }
        return (
            <ButtonInnerText>
                {paymentState === 'pristine' && 'Support Curator'}
                {paymentState === 'success' && <BoldText>Supported</BoldText>}
                {paymentState === 'error' && (
                    <div>
                        Error processing payment. <BoldText>Try again</BoldText>
                    </div>
                )}
            </ButtonInnerText>
        )
    }

    render() {
        const { isDisplayed } = this.state
        return (
            <Container>
                {isDisplayed && (
                    <>
                        {/*<Button
                            onClick={this.handleButtonClick}
                            isSupported={paymentMade}
                            supportedTaskState={makePaymentTaskState}
                            theme={theme}
                        >
                            {this.renderButtonInnerHTML()}
                        </Button>
                        */}
                        <PrimaryAction
                            onClick={() =>
                                this.handleWebLinkClick(
                                    'https://worldbrain.io/tutorial/webmonetization',
                                )
                            }
                            label={
                                <ButtonContent>
                                    <Icon
                                        icon={'coilIcon'}
                                        heightAndWidth={'16px'}
                                        color="white"
                                        hoverOff
                                    />
                                    Install Coil Extension
                                </ButtonContent>
                            }
                        />
                    </>
                )}
            </Container>
        )
    }
}

export default CuratorSupportButtonBlock
