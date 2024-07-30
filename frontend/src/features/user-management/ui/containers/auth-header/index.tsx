import React from 'react'
import { UIElement } from '../../../../../main-ui/classes'
import Logic from './logic'
import {
    AuthHeaderEvent,
    AuthHeaderDependencies,
    AuthHeaderState,
} from './types'
import styled from 'styled-components'
import AuthMenu from '../../components/auth-menu'
import ProfileEditModal from '../profile-edit-modal'
import LoadingIndicator from '../../../../../common-ui/components/loading-indicator'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { getViewportBreakpoint } from '../../../../../main-ui/styles/utils'
import { ViewportBreakpoint } from '../../../../../main-ui/styles/types'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'

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
    font-size: 15px;
    font-weight: 400;
    cursor: pointer;
    font-family: ${(props) => props.theme.fonts.primary};
    color: ${(props) => props.theme.colors.greyScale5};
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
    height: fit-content;
    width: fit-content;
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
    height: 100%;
    align-items: center;
`
const Wrapper = styled.div``

export default class AuthHeader extends UIElement<
    AuthHeaderDependencies,
    AuthHeaderState,
    AuthHeaderEvent
> {
    constructor(props: AuthHeaderDependencies) {
        super(props, { logic: new Logic(props) })
    }

    private UserInfoButtonRef = React.createRef<HTMLDivElement>()

    get viewportBreakpoint(): ViewportBreakpoint {
        return getViewportBreakpoint(this.getViewportWidth())
    }

    renderAuthMenu() {
        if (!this.state.showMenu) {
            return null
        }

        return (
            this.UserInfoButtonRef?.current && (
                <PopoutBox
                    placement="bottom-end"
                    closeComponent={() => this.processEvent('hideMenu', null)}
                    targetElementRef={this.UserInfoButtonRef?.current}
                    strategy="absolute"
                    getPortalRoot={this.props.getRootElement}
                >
                    <MenuContainerOuter>
                        <AuthMenu
                            onSettingsRequested={() => {
                                this.processEvent('hideMenu', null)
                                this.processEvent('showSettings', null)
                            }}
                            onLogoutRequested={() =>
                                this.processEvent('logout', null)
                            }
                            onAccountSettingsRequested={() => {
                                this.processEvent('hideMenu', null)
                                this.processEvent('showAccountSettings', null)
                            }}
                        />
                    </MenuContainerOuter>
                </PopoutBox>
            )
        )
    }

    render() {
        if (this.state.loadState !== 'success') {
            return (
                <LoadingBox>
                    <LoadingIndicator size={20} />
                </LoadingBox>
            )
        }

        if (!this.state.user) {
            return (
                <TooltipBox
                    getPortalRoot={this.props.getRootElement}
                    placement="bottom"
                    tooltipText="Login or SignUp"
                >
                    <Icon
                        onClick={() => this.processEvent('login', null)}
                        icon={'login'}
                        heightAndWidth="24px"
                    />
                </TooltipBox>
            )
        }

        return (
            <Wrapper>
                <TooltipBox
                    placement="bottom"
                    tooltipText={'Settings / Account'}
                    getPortalRoot={this.props.getRootElement}
                >
                    {this.state.loadState !== 'success' ? (
                        <LoadingIndicator size={16} />
                    ) : (
                        <Icon
                            onClick={() =>
                                this.processEvent('toggleMenu', null)
                            }
                            icon="personFine"
                            containerRef={this.UserInfoButtonRef}
                            heightAndWidth="24px"
                        />
                    )}
                </TooltipBox>
                {this.renderAuthMenu()}
                {this.state.showAccountSettings && (
                    <ProfileEditModal
                        services={this.props.services}
                        onCloseRequested={() =>
                            this.processEvent('hideAccountSettings', null)
                        }
                    />
                )}
            </Wrapper>
        )
    }
}
