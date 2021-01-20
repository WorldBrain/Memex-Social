import React from 'react'
import styled from 'styled-components'

import { UIElement } from '../../../../../main-ui/classes'
import { theme } from '../../../../../main-ui/styles/theme'
import { Theme } from '../../../../../main-ui/styles/types'
import {
    ProfilePopupDependencies,
    ProfilePopupEvent,
    ProfilePopupState,
} from './types'
import ProfilePopupLogic from './logic'

import PublicProfile from '../../components/public-profile'
import CuratorSupportButtonBlock from '../curator-support-button-block'
import LoadingScreen from '../../../../../common-ui/components/loading-screen'

const Container = styled.div`
    height: 'min-content';
    width: 'min-content';
    position: relative;
`

const PopupContainer = styled.div<{ theme: Theme }>`
    position: absolute;
    bottom: 0;
    left: 0;
    z-index: ${(props) => props.theme.zIndices.overlay}
    width: 164px;
    min-height: 111px;
    ${(props) => `padding: ${props.theme.spacing.small};`};
    ${(props) => `border-radius: ${props.theme.borderRadii.default};`}
    ${(props) => `background-color: ${props.theme.colors.background};`}
    ${(props) => `font-family: ${props.theme.fonts.primary};`}
    color: ${(props) => props.theme.colors.primary};
`

export default class ProfilePopupContainer extends UIElement<
    ProfilePopupDependencies,
    ProfilePopupState,
    ProfilePopupEvent
> {
    constructor(props: ProfilePopupDependencies) {
        super(props, { logic: new ProfilePopupLogic(props) })
    }

    handleMouseEnter() {
        this.processEvent('initPopup', null)
    }

    handleMouseLeave() {
        this.processEvent('hidePopup', null)
    }

    renderPopup() {
        const { profileTaskState, profileData } = this.state
        return (
            <PopupContainer theme={theme}>
                {profileTaskState === 'running' && <LoadingScreen />}
                {(profileTaskState === 'pristine' ||
                    profileTaskState === 'success') && (
                    <PublicProfile
                        user={this.state.user}
                        webLinksArray={this.state.webLinksArray}
                        profileData={profileData}
                    />
                )}
                {profileData.paymentPointer && (
                    <CuratorSupportButtonBlock
                        services={this.props.services}
                        storage={this.props.storage}
                        paymentPointer={profileData.paymentPointer}
                    />
                )}
            </PopupContainer>
        )
    }

    render() {
        return (
            <>
                <Container
                    onMouseEnter={this.handleMouseEnter}
                    onMouseLeave={this.handleMouseLeave}
                >
                    {this.props.children}
                </Container>
                {this.state.isDisplayed && this.renderPopup()}
            </>
        )
    }
}
