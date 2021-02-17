import React from 'react'
import styled from 'styled-components'

import { UIElement } from '../../../../../main-ui/classes'
import { UITaskState } from '../../../../../main-ui/types'
import { theme } from '../../../../../main-ui/styles/theme'
import { Theme } from '../../../../../main-ui/styles/types'

import {
    CuratorSupportButtonBlockEvent,
    CuratorSupportButtonBlockState,
    CuratorSupportButtonBlockDependencies,
} from './types'
import CuratorSupportButtonBlockLogic from './logic'

import LoadingScreen from '../../../../../common-ui/components/loading-screen'

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
    supportedTaskState: UITaskState
    isSupported: boolean
}>`
    height: 40px;
    width: 140px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    ${(props) =>
        `padding: ${props.theme.spacing.small} ${props.theme.spacing.medium};`}
    ${(props) =>
        props.supportedTaskState === 'pristine' &&
        `border: 2px solid ${props.theme.colors.grey};`}
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
    font-size: ${(props) => props.theme.fontSizes.text};
    line-height: ${(props) => props.theme.lineHeights.text};
`

const BoldText = styled(ButtonInnerText)`
    font-weight: 700;
`

const Link = styled.a<{ theme: Theme }>`
    ${(props) => `font-size: ${props.theme.fontSizes.text};`}
    ${(props) => `line-height: ${props.theme.lineHeights.text};`}
    text-decoration: underline;
    ${(props) => `margin-left: ${props.theme.spacing.medium};`}
    color: ${(props) => props.theme.colors.primary};
`

const ErrorMessage = styled.div<{ theme: Theme }>`
    width: 100%;
    height: min-content;
    border-radius: ${(props) => props.theme.borderRadii.default};
    background-color: ${(props) => props.theme.colors.secondary};
    display: flex;
    justify-content: center;
    align-items: center;
`

export class CuratorSupportButtonBlock extends UIElement<
    CuratorSupportButtonBlockDependencies,
    CuratorSupportButtonBlockState,
    CuratorSupportButtonBlockEvent
> {
    constructor(props: CuratorSupportButtonBlockDependencies) {
        super(props, { logic: new CuratorSupportButtonBlockLogic(props) })
    }

    handleButtonClick: React.MouseEventHandler = () => {
        this.processEvent('toggleSupporterRelationship', null)
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
        const { toggleRelationshipTaskState } = this.state
        if (toggleRelationshipTaskState === 'running') {
            return <LoadingScreen />
        }
        return (
            <ButtonInnerText>
                {toggleRelationshipTaskState === 'pristine' &&
                    'Support Curator'}
                {toggleRelationshipTaskState === 'success' && (
                    <BoldText>Supported</BoldText>
                )}
                {toggleRelationshipTaskState === 'error' && (
                    <div>
                        Error processing payment. <BoldText>Try again</BoldText>
                    </div>
                )}
            </ButtonInnerText>
        )
    }

    renderButtonBlock() {
        const {
            supporterRelationshipExists,
            toggleRelationshipTaskState,
        } = this.state
        return (
            <Container>
                <Button
                    onClick={this.handleButtonClick}
                    isSupported={supporterRelationshipExists}
                    supportedTaskState={toggleRelationshipTaskState}
                    theme={theme}
                >
                    {/*<Icon theme={theme} />*/}
                    {this.renderButtonInnerHTML()}
                </Button>
                <Link
                    href={
                        toggleRelationshipTaskState === 'error'
                            ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                            : 'https://www.youtube.com/watch?v=at_f98qOGY0'
                    }
                    theme={theme}
                >
                    {toggleRelationshipTaskState === 'error'
                        ? 'Help>>'
                        : 'Learn More>>'}
                </Link>
            </Container>
        )
    }

    render() {
        if (this.state.initialLoadTaskState === 'running') {
            return this.renderLoadingSceen()
        } else if (this.state.initialLoadTaskState === 'error') {
            return this.renderErrorScreen()
        } else {
            return this.renderButtonBlock()
        }
    }
}

export default CuratorSupportButtonBlock
