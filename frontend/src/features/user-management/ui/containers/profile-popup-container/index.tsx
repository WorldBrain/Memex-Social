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
    position: relative;
    display: inline-block;
    cursor: default;
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
            loadState: profileTaskState,
            userPublicProfile,
            profileLinks: webLinksArray,
        } = this.state
        const { services } = this.props
        return (
            <ProfilePopup
                user={user}
                userRef={this.props.userRef}
                taskState={profileTaskState}
                userPublicProfile={userPublicProfile}
                services={services}
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
                {/* {this.state.isDisplayed && this.renderPopup()} */}
            </Container>
        )
    }
}
