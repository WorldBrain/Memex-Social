import React from 'react'
import styled from 'styled-components'

import { UIElement } from '../../../../../main-ui/classes'
import {
    ProfilePopupContainerDependencies,
    ProfilePopupContainerEvent,
    ProfilePopupContainerState,
} from './types'
import ProfilePopupContainerLogic from './logic'

import ProfilePopup from '../../components/profile-popup'

const Container = styled.div`
    height: 'min-content';
    width: 'min-content';
    position: relative;
`

export type ProfilePopupProps = ProfilePopupContainerDependencies

export default class ProfilePopupContainer extends UIElement<
    ProfilePopupContainerDependencies,
    ProfilePopupContainerState,
    ProfilePopupContainerEvent
> {
    constructor(props: ProfilePopupContainerDependencies) {
        super(props, { logic: new ProfilePopupContainerLogic(props) })
    }

    handleMouseEnter() {
        this.processEvent('initPopup', null)
    }

    handleMouseLeave() {
        this.processEvent('hidePopup', null)
    }

    renderPopup() {
        const {
            user,
            profileTaskState,
            userPublicProfile,
            webLinksArray,
        } = this.state
        const { services, storage } = this.props
        return (
            <ProfilePopup
                user={user}
                taskState={profileTaskState}
                userPublicProfile={userPublicProfile}
                services={services}
                storage={storage}
                webLinksArray={webLinksArray}
            />
        )
    }

    render() {
        return (
            <Container
                onMouseEnter={() => this.handleMouseEnter()}
                onMouseLeave={() => this.handleMouseLeave()}
            >
                {this.props.children}
                {this.state.isDisplayed && this.renderPopup()}
            </Container>
        )
    }
}
