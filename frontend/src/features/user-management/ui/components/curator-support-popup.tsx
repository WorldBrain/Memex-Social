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
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'

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
    text-align: center;
`

const Text = styled.div<{}>`
    width: 100%;
    height: min-content;
    font-size: 14px;
    margin-top: 5px;
    color: ${(props) => props.theme.colors.lighterText};
    line-height: 21px;
    text-align: center;
`

const LoadingBox = styled.div`
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
`

interface CuratorSupportPopupProps {
    services: UIElementServices<
        'userManagement' | 'webMonetization' | 'documentTitle'
    >
    storage: Pick<StorageModules, 'users'>
    loadState: UITaskState
    paymentState: UITaskState
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
            <HoverBox width="340px" padding={'20px 30px'}>
                {loadState === 'running' && (
                    <LoadingBox>
                        <LoadingIndicator size={30} />
                    </LoadingBox>
                )}
                {loadState === 'success' && (
                    <>
                        {this.props.paymentState === 'running' && (
                            <>
                                <Margin bottom="smallest">
                                    <Title>Support in Progress</Title>
                                </Margin>
                                <Text>
                                    While you are visiting this Space, the
                                    curator will be supported with a few cents
                                    per minute.
                                </Text>
                            </>
                        )}
                        {this.props.paymentState !== 'running' &&
                            this.props.isMonetizationAvailable && (
                                <>
                                    <Margin bottom="smallest">
                                        <Title>Support the Curator</Title>
                                    </Margin>
                                    <Text>
                                        Click to support the creator via{' '}
                                        <i>WebMonetizations</i> & donate a few
                                        cents for every visit to this Space.
                                    </Text>
                                </>
                            )}
                        {!paymentMade && !this.props.isMonetizationAvailable && (
                            <>
                                <Margin bottom="smallest">
                                    <Title>Support the Space curator</Title>
                                </Margin>
                                <Margin bottom="medium">
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
