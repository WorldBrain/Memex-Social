import React, { PureComponent } from 'react'
import styled from 'styled-components'
import { Margin, Padding } from 'styled-components-spacing'

import { Theme } from '../../../../main-ui/styles/types'
import {
    ProfileWebLink,
    User,
    UserPublicProfile,
    UserReference,
} from '../../types'
import { UITaskState } from '../../../../main-ui/types'

import { theme } from '../../../../main-ui/styles/theme'
import LoadingScreen from '../../../../common-ui/components/loading-screen'
import { StorageModules } from '../../../../storage/types'
import { UIElementServices } from '../../../../main-ui/classes'
import CuratorSupportButtonBlock from '../../../web-monetization/ui/containers/curator-support-button-block'
import Icon from '../../../../common-ui/components/icon'

export const PopupContainer = styled.div<{ theme: Theme }>`
    position: absolute;
    width: 270px;
    min-height: 111px;
    font-family: ${(props) => props.theme.fonts.primary};
    color: ${(props) => props.theme.colors.primary};
    background-color: ${(props) => props.theme.colors.background};
    padding: 15px;
    border-radius: ${(props) => props.theme.borderRadii.default};
    z-index: ${(props) => props.theme.zIndices.overlay};
    box-shadow: 0px 2.21787px 3.69646px 1.47858px rgba(0, 0, 0, 0.2);
`

const ProfileContainer = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`

const ProfileHeader = styled.div`
    width: 100%;
    height: min-content;
    display: flex;
    justify-content: start;
`

const ProfileHeaderInnerContainer = styled.div<{ theme: Theme }>`
    height: min-content;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: start;
`

const DisplayName = styled.div<{ theme: Theme }>`
    font-size: ${(props) => props.theme.fontSizes.url};
    line-height: ${(props) => props.theme.lineHeights.text};
    font-weight: 700;
`

const WebLinksContainer = styled.div`
    height: 50%;
    width: 100%;
    display: flex;
    justify-content: start;
    align-items: center;
    padding-top: 10px;
`

const ProfileBio = styled.div<{ theme: Theme }>`
    width: 100%;
    height: min-content;
    font-size: ${(props) => props.theme.fontSizes.text};
    line-height: ${(props) => props.theme.lineHeights.text};
    text-align: left;
`

interface ProfilePopupProps {
    user: User
    userRef: UserReference | null
    services: UIElementServices<'userManagement' | 'webMonetization'>
    storage: Pick<StorageModules, 'users'>
    taskState: UITaskState
    userPublicProfile: UserPublicProfile | null
    webLinksArray: ProfileWebLink[]
}

export default class ProfilePopup extends PureComponent<ProfilePopupProps> {
    handleWebLinkClick = (url: string): void => {
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
        if (newWindow) newWindow.opener = null
    }

    render() {
        const { props } = this
        const {
            user: { displayName },
            taskState,
            userPublicProfile,
            webLinksArray,
        } = this.props
        return (
            <PopupContainer theme={theme}>
                {taskState === 'running' && <LoadingScreen />}
                {(taskState === 'pristine' || taskState === 'success') && (
                    <>
                        <ProfileContainer>
                            <ProfileHeader>
                                {/*<UserAvatar path={avatarURL} user={{displayName: displayName ?? 'Unknown User'}} />*/}
                                <Padding>
                                    <ProfileHeaderInnerContainer theme={theme}>
                                        <DisplayName theme={theme}>
                                            {displayName}
                                        </DisplayName>
                                        {!!webLinksArray.length && (
                                            <WebLinksContainer>
                                                {webLinksArray.map(
                                                    (
                                                        { url, fileName },
                                                        index,
                                                    ) => (
                                                        <Margin right="small">
                                                            <Icon
                                                                key={index}
                                                                fileName={fileName}
                                                                height="18px"
                                                                onClick={() =>
                                                                    this.handleWebLinkClick(
                                                                        url,
                                                                    )
                                                                }
                                                            />
                                                        </Margin>
                                                    ),
                                                )}
                                            </WebLinksContainer>
                                        )}
                                    </ProfileHeaderInnerContainer>
                                </Padding>
                            </ProfileHeader>
                            {userPublicProfile?.bio && (
                                <Margin top={'small'}>
                                    <ProfileBio theme={theme}>
                                        {userPublicProfile?.bio}
                                    </ProfileBio>
                                </Margin>
                            )}
                        </ProfileContainer>
                        {/*{props.userRef && userPublicProfile?.paymentPointer && (
                            <CuratorSupportButtonBlock
                                services={props.services}
                                storage={props.storage}
                                curatorUserRef={props.userRef}
                            />
                        )}*/}
                    </>
                )}
            </PopupContainer>
        )
    }
}
