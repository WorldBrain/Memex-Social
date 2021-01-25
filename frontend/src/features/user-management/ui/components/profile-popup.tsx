import React, { PureComponent } from 'react'
import styled from 'styled-components'

import { Theme } from '../../../../main-ui/styles/types'
import { ProfileWebLink, User, UserPublicProfile } from '../../types'
import { UITaskState } from '../../../../main-ui/types'

import { theme } from '../../../../main-ui/styles/theme'
import LoadingScreen from '../../../../common-ui/components/loading-screen'
import { StorageModules } from '../../../../storage/types'
import { UIElementServices } from '../../../../main-ui/classes'
import CuratorSupportButtonBlock from './curator-support-button-block'

export const PopupContainer = styled.div<{ theme: Theme }>`
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

const ProfileContainer = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: start;
    align-items: start;
`

const ProfileHeader = styled.div`
    width: 100%;
    height: min-content;
    display: flex;
    justify-content: start;
`

const Avatar = styled.div<{ theme: Theme; path: string }>`
    height: 24px;
    width: 24px;
    margin: ${(props) => props.theme.spacing.small};
    border-radius: 50%;
`

const ProfileHeaderInnerContainer = styled.div<{ theme: Theme }>`
    height: min-content;
    width: min-content;
    padding: ${(props) => props.theme.spacing.small};
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: start;
`

const DisplayName = styled.div<{ theme: Theme }>`
    font-size: ${(props) => props.theme.fontSizes.text};
    line-height: ${(props) => props.theme.lineHeights.text};
    font-weight: 700;
`

const WebLinksContainer = styled.div`
    height: 50%;
    width: 100%;
    display: flex;
    justify-content: start;
    align-items: center;
`

const WebLinkIcon = styled.div<{ path: string }>`
    height: 10px;
    width: 10px;
    margin-right: 10px;
`

const ProfileBio = styled.div<{ theme: Theme }>`
    width: 100%;
    height: min-content;
    padding: ${(props) => props.theme.spacing.small};
    font-size: ${(props) => props.theme.fontSizes.smallText};
    line-height: ${(props) => props.theme.lineHeights.smallText};
`

interface ProfilePopupProps {
    user: User
    services: UIElementServices<'userManagement'>
    storage: Pick<StorageModules, 'users'>
    taskState: UITaskState
    profileData: UserPublicProfile
    webLinksArray: ProfileWebLink[]
}

export default class ProfilePopup extends PureComponent<ProfilePopupProps> {
    handleWebLinkClick = (url: string): void => {
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
        if (newWindow) newWindow.opener = null
    }

    render() {
        const {
            user: { displayName },
            services,
            storage,
            taskState,
            profileData: { bio, avatarURL, paymentPointer },
            webLinksArray,
        } = this.props
        return (
            <PopupContainer theme={theme}>
                {taskState === 'running' && <LoadingScreen />}
                {(taskState === 'pristine' || taskState === 'success') && (
                    <>
                        <ProfileContainer>
                            <ProfileHeader>
                                <Avatar path={avatarURL} theme={theme}>
                                    {(!avatarURL &&
                                        displayName &&
                                        displayName[0]) ||
                                        'U'}
                                </Avatar>
                                <ProfileHeaderInnerContainer theme={theme}>
                                    <DisplayName theme={theme}>
                                        {displayName}
                                    </DisplayName>
                                    {webLinksArray.length && (
                                        <WebLinksContainer>
                                            {webLinksArray.map(
                                                ({ url, iconPath }) => (
                                                    <WebLinkIcon
                                                        path={iconPath}
                                                        onClick={() =>
                                                            this.handleWebLinkClick(
                                                                url,
                                                            )
                                                        }
                                                    />
                                                ),
                                            )}
                                        </WebLinksContainer>
                                    )}
                                </ProfileHeaderInnerContainer>
                                <ProfileBio theme={theme}>{bio}</ProfileBio>
                            </ProfileHeader>
                        </ProfileContainer>
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
