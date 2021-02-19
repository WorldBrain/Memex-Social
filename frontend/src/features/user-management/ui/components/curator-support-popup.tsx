import React, { PureComponent } from 'react'
import styled from 'styled-components'

import { theme } from '../../../../main-ui/styles/theme'
import { Theme } from '../../../../main-ui/styles/types'
import { UITaskState } from '../../../../main-ui/types'
import { UIElementServices } from '../../../../main-ui/classes'
import { StorageModules } from '../../../../storage/types'

import LoadingScreen from '../../../../common-ui/components/loading-screen'
import CuratorSupportButtonBlock from '../../../web-monetization/ui/containers/curator-support-button-block'
import { UserReference } from '../../types'
import { Margin } from 'styled-components-spacing'

const PopupContainer = styled.div<{ theme: Theme }>`
    position: absolute;
    z-index: ${(props) => props.theme.zIndices.overlay};
    padding: ${(props) => props.theme.spacing.medium};
    border-radius: ${(props) => props.theme.borderRadii.default};
    background-color: ${(props) => props.theme.colors.background};
    font-family: ${(props) => props.theme.fonts.primary};
    color: ${(props) => props.theme.colors.primary};
    box-shadow: 0px 0px 4.19178px rgba(0, 0, 0, 0.14);
    width: 240px;
    left: -100px;
`

const Title = styled.div<{ theme: Theme }>`
    font-size: ${(props) => props.theme.fontSizes.text};
    line-height: ${(props) => props.theme.lineHeights.text};
    font-weight: 700;
`

const Text = styled.div<{ theme: Theme }>`
    width: 100%;
    height: min-content;
    font-size: ${(props) => props.theme.fontSizes.text};
    line-height: ${(props) => props.theme.lineHeights.text};
`

interface CuratorSupportPopupProps {
    services: UIElementServices<'userManagement' | 'webMonetization'>
    storage: Pick<StorageModules, 'users'>
    curatorUserRef: UserReference
    taskState: UITaskState
    supported: string
}

export default class CuratorSupportPopup extends PureComponent<CuratorSupportPopupProps> {
    render() {
        const { taskState, curatorUserRef, services, storage, supported} = this.props
        return (
            <PopupContainer theme={theme}>
                {taskState === 'running' && <LoadingScreen />}
                {(taskState === 'pristine' || taskState === 'success') && (
                    <>
                    {supported === 'success' && (
                        <>
                        <Margin bottom="smallest">
                            <Title theme={theme}>
                                Curator Supported!
                            </Title>
                        </Margin>
                        <Text theme={theme}>
                            For every visit you'll donate a few cents to this creator. 
                        </Text>
                        <CuratorSupportButtonBlock
                            services={services}
                            storage={storage}
                            curatorUserRef={curatorUserRef}
                        />
                    </>


                    )}
                    {supported !== 'success' && (
                        <>
                        <Margin bottom="smallest">
                            <Title theme={theme}>
                                Support Collection Curator
                            </Title>
                        </Margin>
                        <Text theme={theme}>
                            Automatically donate a few cents for every visit to
                            this collection.
                        </Text>
                        <CuratorSupportButtonBlock
                            services={services}
                            storage={storage}
                            curatorUserRef={curatorUserRef}
                        />
                    </>

                    )}
                    </>
                )}
            </PopupContainer>
        )
    }
}
