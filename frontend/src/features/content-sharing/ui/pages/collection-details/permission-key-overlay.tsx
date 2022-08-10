import React from 'react'
import styled, { css } from 'styled-components'
import Overlay from '../../../../../main-ui/containers/overlay'
import { ViewportBreakpoint } from '../../../../../main-ui/styles/types'
import { UIElementServices } from '../../../../../services/types'
import { UITaskState } from '../../../../../main-ui/types'
import { Margin } from 'styled-components-spacing'
import ExternalLink from '../../../../../common-ui/components/external-link'
import { ProcessSharedListKeyResult } from '@worldbrain/memex-common/lib/content-sharing/service/types'
import { PrimaryAction } from '../../../../../common-ui/components/PrimaryAction'

const Content = styled.div<{
    viewportBreakpoint: ViewportBreakpoint
}>`
    max-width: 800px;
    min-width: 70%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    padding: 40px;

    > * {
        font-family: ${(props) => props.theme.fonts.primary};
    }

    ${(props) =>
        props.viewportBreakpoint === 'small' &&
        css`
            max-width: 90%;
        `}
    ${(props) =>
        props.viewportBreakpoint === 'mobile' &&
        css`
            max-width: 90%;
        `}
`
const InvitedNotificationContainer = styled.div<{
    viewportBreakpoint: ViewportBreakpoint
}>`
    display: flex;
    width: 100%;
    justify-content: center;
    margin-top: 10px;
    /* position: absolute; */

    ${(props) =>
        props.viewportBreakpoint === 'mobile' &&
        css`
            width: 100%;
            padding: 10px 15px;
        `}
`

const InvitedNotification = styled.div<{
    viewportBreakpoint: ViewportBreakpoint
}>`
        margin: auto;
        width: 100%;
        max-width: 800px;
        padding: 10px 15px;
        color ${(props) => props.theme.colors.purple};
        font-size: 14px;
        font-weight: 400;
        display: flex;
        justify-content: center;
        align-items: center;
        border: 1px solid ${(props) =>
            props.theme.darkModeColors.lineLightGrey};
        font-family: ${(props) => props.theme.fonts.primary};

        ${(props) =>
            props.viewportBreakpoint === 'mobile' &&
            css`
                display: inline-block;
            `}
`

const Title = styled.div`
    font-weight: 800;
    font-size: 22px;
    color: ${(props) => props.theme.colors.darkerText};
    text-align: center;
`
const SubTitle = styled.div`
    font-weight: 400;
    font-size: 16px;
    text-align: center;
    color: ${(props) => props.theme.colors.lighterText};
`
const ButtonsBox = styled.div`
    display: flex;
    justify-content: center;
    width: 250px;
    padding: 15px 0px;
    flex-direction: column;
    align-items: center;
`

const secondaryButtonCss = css`
    display: flex;
    justify-content: center;
    padding: 5px 10px;
    font-size: 14px;
    border-radius: 3px;
    cursor: pointer;
    font-weight: 600;
    color: ${(props) => props.theme.colors.primary};
    text-decoration: none;
`

const SecondaryButtonLink = styled(ExternalLink)`
    ${secondaryButtonCss}
`

export default function PermissionKeyOverlay(props: {
    services: UIElementServices<'overlay'>
    viewportBreakpoint: ViewportBreakpoint
    onCloseRequested: () => void
    permissionKeyState?: UITaskState
    permissionKeyResult?: ProcessSharedListKeyResult
    isContributor?: boolean
    isOwner?: boolean
}) {
    if (props.permissionKeyState === 'error') {
        return (
            <Overlay
                services={props.services}
                onCloseRequested={props.onCloseRequested}
            >
                <Content viewportBreakpoint={props.viewportBreakpoint}>
                    <Title>Error opening invite link</Title>
                    <Margin top="smallest">
                        <SubTitle>
                            There has been an error with this link. <br /> Try
                            again and contact support if the problem persists.
                        </SubTitle>
                    </Margin>
                    <Margin top="medium">
                        <ButtonsBox>
                            <PrimaryAction
                                label={'Close'}
                                onClick={props.onCloseRequested}
                            />
                            <SecondaryButtonLink href="mailto:support@memex.garden">
                                Contact Support
                            </SecondaryButtonLink>
                        </ButtonsBox>
                    </Margin>
                </Content>
            </Overlay>
        )
    }
    if (props.permissionKeyResult === 'denied') {
        return (
            <Overlay
                services={props.services}
                onCloseRequested={props.onCloseRequested}
            >
                <Content viewportBreakpoint={props.viewportBreakpoint}>
                    <Title>Invite link invalid</Title>
                    <Margin top="small">
                        <SubTitle>
                            Thn link you used is invalid or has been revoked by
                            the creator.
                        </SubTitle>
                    </Margin>
                    <Margin top={'medium'}>
                        <ButtonsBox>
                            <PrimaryAction
                                label={'Close'}
                                onClick={props.onCloseRequested}
                            />
                            <SecondaryButtonLink href="mailto:support@worldbrain.io">
                                Contact Support
                            </SecondaryButtonLink>
                        </ButtonsBox>
                    </Margin>
                </Content>
            </Overlay>
        )
    }
    if (
        (props.permissionKeyState === 'running' ||
            props.permissionKeyState === 'success') &&
        props.isContributor &&
        !props.isOwner
    ) {
        return (
            <InvitedNotificationContainer
                viewportBreakpoint={props.viewportBreakpoint}
            >
                <InvitedNotification
                    viewportBreakpoint={props.viewportBreakpoint}
                    onClick={() => props.onCloseRequested}
                >
                    🎉 You’ve been invited as a contributor. Add pages and
                    highlights via the{' '}
                    <ExternalLink href="https://links.memex.garden/download_collab_notif">
                        Memex extension
                    </ExternalLink>
                </InvitedNotification>
            </InvitedNotificationContainer>
            // <Overlay
            //     services={props.services}
            //     onCloseRequested={props.onCloseRequested}
            // >
            //     <Content viewportBreakpoint={props.viewportBreakpoint}>
            //         <Title>
            //             You’re now a Contributor to this collection
            //         </Title>
            //         <Margin top={'small'}>
            //             <SubTitle>
            //                 Install the Memex Browser extension to add pages
            //                 and annotations
            //             </SubTitle>
            //         </Margin>
            //         <Margin top={'small'}>
            //             <BrowserIconsBox>
            //                 <BrowserIcon src={braveLogo} />
            //                 <BrowserIcon src={firefoxLogo} />
            //                 <BrowserIcon src={chromeLogo} />
            //             </BrowserIconsBox>
            //         </Margin>
            //         <Margin top={'medium'}>
            //             <ButtonsBox>
            //                 <PrimaryAction
            //                     onClick={() =>
            //                         window.open('https://memex.garden')
            //                     }
            //                     label={'Download Memex'}
            //                 />
            //                 <SecondaryButton
            //                     onClick={props.onCloseRequested}
            //                 >
            //                     Already have it
            //                 </SecondaryButton>
            //             </ButtonsBox>
            //         </Margin>
            //     </Content>
            // </Overlay>
        )
    }
    return null
}
