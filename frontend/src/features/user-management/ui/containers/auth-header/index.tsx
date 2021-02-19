import React from 'react'
import { UIElement } from '../../../../../main-ui/classes'
import Logic from './logic'
import {
    AuthHeaderEvent,
    AuthHeaderDependencies,
    AuthHeaderState,
} from './types'
import styled, { css } from 'styled-components'
import UserAvatar from '../../../../../common-ui/components/user-avatar'
import { Margin } from 'styled-components-spacing'
import { Closable } from '../../../../../common-ui/components/closable'
import AuthMenu from '../../components/auth-menu'
import ProfileEditModal from '../profile-edit-modal'

const logoImage = require('../../../../../assets/img/memex-icon.svg')

const StyledAuthHeader = styled.div``
const LoginAction = styled.div`
    cursor: pointer;
`

const MemexIcon = styled.div`
    height: 24px;
    background-position: center;
    background-size: contain;
    border: none;
    cursor: pointer;
    background-repeat: no-repeat;
    background-image: url(${logoImage});
    display: flex;
    width: 24px;
    background-position: center;
    background-size: contain;
`

const UserInfo = styled.div`
    display: flex;
    flex-direction: row-reverse;
    align-items: center;
    cursor: pointer;
`
const DisplayName = styled.div`
    display: inline-block;
    font-size: 14px;
    font-weight: bold;
    color: ${(props) => props.theme.colors.primary};
`
const MenuContainerOuter = styled.div`
    position: relative;
`
const MenuContainerInner = styled.div`
    position: absolute;
    display: flex;
    top: 15px;
    right: 0;
`

export default class AuthHeader extends UIElement<
    AuthHeaderDependencies,
    AuthHeaderState,
    AuthHeaderEvent,
> {
    constructor(props: AuthHeaderDependencies) {
        super(props, { logic: new Logic(props) })
    }

    render() {
        if (!this.state.user) {
            return (
                <DisplayName onClick={() => this.processEvent('login', null)}>
                    Login
                </DisplayName>
            )
        }

        return (
            <>
                <StyledAuthHeader>
                    <UserInfo
                        onClick={() => this.processEvent('toggleMenu', null)}
                    >
                        {/*<UserAvatar user={this.state.user} />*/}
                            <Margin left="small">
                                <MemexIcon/>
                            </Margin>
                            <DisplayName>
                                {this.state.user.displayName}
                            </DisplayName>
                    </UserInfo>
                    {this.state.showMenu && (
                        <Closable
                            onClose={() => this.processEvent('hideMenu', null)}
                        >
                            <MenuContainerOuter>
                                <MenuContainerInner>
                                    <AuthMenu
                                        onSettingsRequested={() => {
                                            this.processEvent('hideMenu', null)
                                            this.processEvent(
                                                'showSettings',
                                                null,
                                            )
                                        }}
                                        onLogoutRequested={() =>
                                            this.processEvent('logout', null)
                                        }
                                        onAccountSettingsRequested={() => {
                                            this.processEvent('hideMenu', null)
                                            this.processEvent(
                                                'showAccountSettings',
                                                null,
                                            )
                                        }}
                                    />
                                </MenuContainerInner>
                            </MenuContainerOuter>
                        </Closable>
                    )}
                </StyledAuthHeader>
                {/* {this.state.showSettings && (
          <AccountSettings
            services={this.props.services}
            storage={this.props.storage}
            onCloseRequested={() => this.processEvent("hideSettings", null)}
          />
        )} */}
                {this.state.showAccountSettings && (
                    <ProfileEditModal
                        services={this.props.services}
                        storage={this.props.storage}
                        onCloseRequested={() =>
                            this.processEvent('hideAccountSettings', null)
                        }
                    />
                )}
            </>
        )
    }
}
