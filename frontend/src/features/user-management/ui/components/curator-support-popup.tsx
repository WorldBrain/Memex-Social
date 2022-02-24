import React, { PureComponent } from 'react'
import styled from 'styled-components'

import { UITaskState } from '../../../../main-ui/types'
import { UIElementServices } from '../../../../services/types'
import { StorageModules } from '../../../../storage/types'

import LoadingScreen from '../../../../common-ui/components/loading-screen'
import CuratorSupportButtonBlock from '../../../web-monetization/ui/containers/curator-support-button-block'
import { UserReference } from '../../types'
import { Margin } from 'styled-components-spacing'
import { HoverBox } from '../../../../common-ui/components/hoverbox'

const PopupContainer = styled.div`
    position: absolute;
    z-index: ${(props) => props.theme.zIndices.overlay};
    padding: ${(props) => props.theme.spacing.medium};
    border-radius: ${(props) => props.theme.borderRadii.default};
    background-color: ${(props) => props.theme.colors.background};
    font-family: ${(props) => props.theme.fonts.primary};
    color: ${(props) => props.theme.colors.primary};
    box-shadow: 0px 0px 4.19178px rgba(0, 0, 0, 0.14);
    width: 260px;
    left: -110px;
`

const Title = styled.div<{}>`
    font-size: 16px;
    color: ${(props) => props.theme.colors.darkerText};
    font-weight: 800;
`

const Text = styled.div<{}>`
    width: 100%;
    height: min-content;
    font-size: 14px;
    margin-bottom: 20px;
    margin-top: 5px;
    color: ${(props) => props.theme.colors.lighterText};
    line-height: 21px;
`

interface CuratorSupportPopupProps {
    services: UIElementServices<
        'userManagement' | 'webMonetization' | 'documentTitle'
    >
    storage: Pick<StorageModules, 'users'>
    loadState: UITaskState
    paymentSate: UITaskState
    curatorUserRef: UserReference
    paymentMade: boolean
    isMonetizationAvailable: boolean
}

export default class CuratorSupportPopup extends PureComponent<CuratorSupportPopupProps> {
    render() {
        const {
            loadState,
            curatorUserRef,
            services,
            storage,
            paymentMade,
        } = this.props
        return (
            <HoverBox width="320px" padding={'20px'} left="-110px">
                {loadState === 'running' && <LoadingScreen />}
                {loadState === 'success' && (
                    <>
                        {paymentMade && (
                            <>
                                <Margin bottom="smallest">
                                    <Title>Curator Supported!</Title>
                                </Margin>
                                <Text>
                                    For every visit you'll donate a few cents to
                                    this creator.
                                </Text>
                            </>
                        )}
                        {!paymentMade && this.props.isMonetizationAvailable && (
                            <>
                                <Margin bottom="smallest">
                                    <Title>Support the Curator</Title>
                                </Margin>
                                <Text>
                                    Use <i>WebMonetization</i> to donate a few
                                    cents for every visit to this collection.
                                </Text>
                                <CuratorSupportButtonBlock
                                    services={services}
                                    storage={storage}
                                    curatorUserRef={curatorUserRef}
                                />
                            </>
                        )}
                        {!paymentMade && !this.props.isMonetizationAvailable && (
                            <>
                                <Margin bottom="smallest">
                                    <Title>Support the Space curator</Title>
                                </Margin>
                                <Margin bottom="smallest">
                                    <Text>
                                        This Space supports WebMonetizations.{' '}
                                        <br />
                                        Donate a few cents on every visit, also
                                        to thousands of creators all around the
                                        web.
                                    </Text>
                                </Margin>
                                <CuratorSupportButtonBlock
                                    services={services}
                                    storage={storage}
                                    curatorUserRef={curatorUserRef}
                                />
                            </>
                        )}
                    </>
                )}
            </HoverBox>
        )
    }
}
