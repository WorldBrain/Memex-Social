import React, { PureComponent } from 'react'
import styled from 'styled-components'

import { Theme } from '../../../../main-ui/styles/types'
import { ProfileWebLink, User, UserPublicProfile } from '../../types'

import { theme } from '../../../../main-ui/styles/theme'

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

interface PublicProfileProps {
    user: User
    profileData: UserPublicProfile
    webLinksArray: ProfileWebLink[]
}

export class PublicProfile extends PureComponent<PublicProfileProps> {
    handleWebLinkClick = (url: string): void => {
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
        if (newWindow) newWindow.opener = null
    }

    render() {
        const {
            user: { displayName },
            profileData: { bio, avatarUrl },
            webLinksArray,
        } = this.props
        return (
            <ProfileContainer>
                <ProfileHeader>
                    <Avatar path={avatarUrl} theme={theme}>
                        {(!avatarUrl && displayName && displayName[0]) || 'U'}
                    </Avatar>
                    <ProfileHeaderInnerContainer theme={theme}>
                        <DisplayName theme={theme}>{displayName}</DisplayName>
                        {webLinksArray.length && (
                            <WebLinksContainer>
                                {webLinksArray.map(({ url, iconPath }) => (
                                    <WebLinkIcon
                                        path={iconPath}
                                        onClick={() =>
                                            this.handleWebLinkClick(url)
                                        }
                                    />
                                ))}
                            </WebLinksContainer>
                        )}
                    </ProfileHeaderInnerContainer>
                    <ProfileBio theme={theme}>{bio}</ProfileBio>
                </ProfileHeader>
            </ProfileContainer>
        )
    }
}

export default PublicProfile
