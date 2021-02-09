import React, { PureComponent } from 'react'
import styled from 'styled-components'

import { theme } from '../../../../main-ui/styles/theme'
import { Theme } from '../../../../main-ui/styles/types'
import { UITaskState } from '../../../../main-ui/types'
import { UIElementServices } from '../../../../main-ui/classes'
import { StorageModules } from '../../../../storage/types'

import LoadingScreen from '../../../../common-ui/components/loading-screen'
import CuratorSupportButtonBlock from '../../../web-monetization/ui/containers/curator-support-button-block'

const PopupContainer = styled.div<{ theme: Theme }>`
    position: absolute;
    bottom: 0;
    left: 0;
    z-index: ${(props) => props.theme.zIndices.overlay}
    width: 164px;
    min-height: 111px;
    padding: ${(props) => props.theme.spacing.small};
    border-radius: ${(props) => props.theme.borderRadii.default};
    background-color: ${(props) => props.theme.colors.background};
    font-family: ${(props) => props.theme.fonts.primary}
    color: ${(props) => props.theme.colors.primary};
`

const Title = styled.div<{ theme: Theme }>`
    font-size: ${(props) => props.theme.fontSizes.text};
    line-height: ${(props) => props.theme.lineHeights.text};
    font-weight: 700;
`

const Text = styled.div<{ theme: Theme }>`
    width: 100%;
    height: min-content;
    padding: ${(props) => props.theme.spacing.small};
    font-size: ${(props) => props.theme.fontSizes.smallText};
    line-height: ${(props) => props.theme.lineHeights.smallText};
`

interface CuratorSupportPopupProps {
    taskState: UITaskState
    paymentPointer: string
    services: UIElementServices<'userManagement'>
    storage: Pick<StorageModules, 'users'>
}

export default class CuratorSupportPopup extends PureComponent<CuratorSupportPopupProps> {
    render() {
        const { taskState, paymentPointer, services, storage } = this.props
        return (
            <PopupContainer theme={theme}>
                {taskState === 'running' && <LoadingScreen />}
                {(taskState === 'pristine' || taskState === 'success') && (
                    <>
                        <Title theme={theme}>Support this Curator</Title>
                        <Text theme={theme}>
                            Donate a few cents with one click
                        </Text>
                        {paymentPointer && (
                            <CuratorSupportButtonBlock
                                services={services}
                                storage={storage}
                                paymentPointer={paymentPointer}
                            />
                        )}
                    </>
                )}
            </PopupContainer>
        )
    }
}
