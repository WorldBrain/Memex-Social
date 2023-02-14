import React, { PureComponent } from 'react'
import styled from 'styled-components'
import { Margin } from 'styled-components-spacing'
import linkifyHtml from 'linkify-html'
import DOMPurify from 'dompurify'
import parse from 'html-react-parser'

import { Theme } from '../../../../main-ui/styles/types'
import {
    ProfileWebLink,
    User,
    UserPublicProfile,
    UserReference,
} from '../../types'
import { UITaskState } from '../../../../main-ui/types'

import { theme } from '../../../../main-ui/styles/theme'
import { StorageModules } from '../../../../storage/types'
import { UIElementServices } from '../../../../services/types'
import Icon from '../../../../common-ui/components/icon'
import { HoverBox } from '../../../../common-ui/components/hoverbox'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'

export const PopupContainer = styled.div<{ theme: Theme }>`
    position: absolute;
    width: 300px;
    max-height: 400px;
    font-family: ${(props) => props.theme.fonts.primary};
    color: ${(props) => props.theme.colors.prime1};
    padding: 15px;
    border-radius: ${(props) => props.theme.borderRadii.default};
    z-index: ${(props) => props.theme.zIndices.overlay};
    box-shadow: 0px 2.21787px 3.69646px 1.47858px rgba(0, 0, 0, 0.2);
`

const ProfileHoverarea = styled.div`
    width: 330px;
    position: absolute;
    padding-top: 2px;
    height: fit-content;
`

const ProfileContainer = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 20px;
    cursor: default;
`

const LoadingContainer = styled.div`
    width: 100%;
    height: 150px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 20px;
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
    letter-spacing: 1px;
    font-size: 16px;
    color: ${(props) => props.theme.colors.white};
    white-space: normal;
`

const WebLinksContainer = styled.div`
    height: 50%;
    width: 100%;
    display: flex;
    justify-content: start;
    align-items: center;
    padding-top: 10px;
`

const ProfileBio = styled(Margin)<{ theme: Theme }>`
    width: 100%;
    height: min-content;
    font-size: 14px;
    line-height: ${(props) => props.theme.lineHeights.text};
    display: block;
    justify-content: flex-start;
    float: left;
    text-align: left;
    color: ${(props) => props.theme.colors.greyScale5};
    white-space: pre-wrap;
    overflow-y: scroll;
    overflow-x: hidden;
    line-break: strict;
    text-overflow: ellipsis;
    max-height: 350px;

    & > a {
        color: ${(props) => props.theme.colors.prime1}70;
    }
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

    convertBioToHTML(string: string) {
        const options = { defaultProtocol: 'https', target: '_blank' }

        const HTML = linkifyHtml(string, options)

        DOMPurify.addHook('afterSanitizeAttributes', function (node) {
            // set all elements owning target to target=_blank
            if ('target' in node) {
                node.setAttribute('target', '_blank')
                // prevent https://www.owasp.org/index.php/Reverse_Tabnabbing
                node.setAttribute('rel', 'noopener noreferrer')
            }
            // set non-HTML/MathML links to xlink:show=new
            if (
                !node.hasAttribute('target') &&
                (node.hasAttribute('xlink:href') || node.hasAttribute('href'))
            ) {
                node.setAttribute('xlink:show', 'new')
            }
        })

        const purifiedHTML = DOMPurify.sanitize(HTML)
        console.log(purifiedHTML)

        const finalHTML = parse(purifiedHTML)

        return finalHTML
    }

    render() {
        const { props } = this
        const { taskState, userPublicProfile, webLinksArray } = props

        if (taskState === 'pristine' || taskState === 'running') {
            return (
                <HoverBox padding="0px">
                    <LoadingContainer>
                        <LoadingIndicator size={30} />
                    </LoadingContainer>
                </HoverBox>
            )
        }

        return (
            <ProfileHoverarea>
                <HoverBox width="300px" padding="0px">
                    <ProfileContainer>
                        <ProfileHeaderInnerContainer theme={theme}>
                            <DisplayName theme={theme}>
                                {props.user.displayName}
                            </DisplayName>
                            {!!webLinksArray.length && (
                                <WebLinksContainer>
                                    {webLinksArray.map(({ url, icon }) => (
                                        <Margin right="small" key={icon}>
                                            <Icon
                                                icon={icon}
                                                height="18px"
                                                color="prime1"
                                                onClick={() =>
                                                    this.handleWebLinkClick(url)
                                                }
                                            />
                                        </Margin>
                                    ))}
                                </WebLinksContainer>
                            )}
                            {userPublicProfile?.bio && (
                                <ProfileBio top={'small'} theme={theme}>
                                    {this.convertBioToHTML(
                                        userPublicProfile?.bio,
                                    )}
                                </ProfileBio>
                            )}
                        </ProfileHeaderInnerContainer>
                    </ProfileContainer>
                    {/*{props.userRef && userPublicProfile?.paymentPointer && (
                            <CuratorSupportButtonBlock
                                services={props.services}
                                storage={props.storage}
                                curatorUserRef={props.userRef}
                            />
                        )}*/}
                </HoverBox>
            </ProfileHoverarea>
        )
    }
}
