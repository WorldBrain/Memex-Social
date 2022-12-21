import React from 'react'
import { UIElement } from '../../../../../main-ui/classes'
import Logic from './logic'
import {
    AuthHeaderEvent,
    AuthHeaderDependencies,
    AuthHeaderState,
} from './types'
import styled from 'styled-components'
import { Closable } from '../../../../../common-ui/components/closable'
import AuthMenu from '../../components/auth-menu'
import ProfileEditModal from '../profile-edit-modal'
import LoadingIndicator from '../../../../../common-ui/components/loading-indicator'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { getViewportBreakpoint } from '../../../../../main-ui/styles/utils'
import { ViewportBreakpoint } from '../../../../../main-ui/styles/types'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'

const StyledAuthHeader = styled.div``

const UserInfo = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    cursor: pointer;
    border-radius: 8px;
    justify-content: center;
    height: 34px;
    width: fit-content;
    grid-gap: 10px;
    padding: 0 10px 0 14px;

    & * {
        cursor: pointer;
    }
`
const DisplayName = styled.div`
    display: block;
    align-items: center;
    grid-gap: 5px;
    font-size: 14px;
    font-weight: 300;
    cursor: pointer;
    font-family: ${(props) => props.theme.fonts.primary};
    color: ${(props) => props.theme.colors.greyScale8};
    max-width: 150px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;

    & * {
        cursor: pointer;
    }
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

const LoadingBox = styled.div`
    display: flex;
    position: relative;
    right: 10px;
    top: 10px;
`

export default class AuthHeader extends UIElement<
    AuthHeaderDependencies,
    AuthHeaderState,
    AuthHeaderEvent
> {
    constructor(props: AuthHeaderDependencies) {
        super(props, { logic: new Logic(props) })
    }

    get viewportBreakpoint(): ViewportBreakpoint {
        return getViewportBreakpoint(this.getViewportWidth())
    }

    render() {
        if (this.state.loadState !== 'success') {
            return (
                <LoadingBox>
                    {' '}
                    <LoadingIndicator size={20} />
                </LoadingBox>
            )
        }

        if (!this.state.user) {
            return (
                <PrimaryAction
                    label={
                        this.state.isMemexInstalled === true
                            ? 'Login'
                            : 'Sign Up'
                    }
                    onClick={() => this.processEvent('login', null)}
                    type={'forth'}
                    size={'medium'}
                    icon={'login'}
                />
            )
        }

        return (
            <>
                <StyledAuthHeader>
                    <UserInfo
                        onClick={() => this.processEvent('toggleMenu', null)}
                    >
                        <DisplayName>{this.state.user.displayName}</DisplayName>
                        <Icon
                            filePath="settings"
                            heightAndWidth="18px"
                            hoverOff
                            color="purple"
                        />
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
