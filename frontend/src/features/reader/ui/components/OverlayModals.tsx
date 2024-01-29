import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import { detect } from 'detect-browser'
import React from 'react'
import styled from 'styled-components'

interface OverlayModalProps {
    type:
        | 'installTools'
        | 'upgradePlan'
        | 'invitedForCollaboration'
        | 'installMemexForVideo'
        | null
    closeModal: () => Promise<void>
}

const OverlayBackground = styled.div`
    background: ${(props) => props.theme.colors.black}30;
    backdrop-filter: blur(10px);
    height: 100vh;
    width: 100vw;
    position: fixed;
    z-index: 1000000000;
    display: flex;
    justify-content: center;
    align-items: center;
`

const OverlayBox = styled.div`
    background: ${(props) => props.theme.colors.black}99;
    backdrop-filter: blur(20px);
    border-radius: 20px;
    border: 1px solid ${(props) => props.theme.colors.greyScale2};
    padding: 50px;
    min-height: 300px;
    min-width: 500px;
    max-width: 800px;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    grid-gap: 15px;

    &:last-child {
        margin-top: 20px;
    }
`

const Title = styled.div`
    font-size: 30px;
    line-height: 45px;
    font-weight: 800;
    background: ${(props) => props.theme.colors.headerGradient};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`
const Subtitle = styled.div`
    font-size: 18px;
    line-height: 24px;
    font-weight: 400;

    color: ${(props) => props.theme.colors.greyScale6};
    text-align: center;
`

export const OverlayModal: React.FC<OverlayModalProps> = ({
    type,
    closeModal,
}) => {
    if (type === 'installTools') {
        return (
            <OverlayBackground onClick={closeModal}>
                <OverlayBox>
                    <Title>Install Memex</Title>
                    <Subtitle>Save and organize your research</Subtitle>
                </OverlayBox>
            </OverlayBackground>
        )
    }
    if (type === 'upgradePlan') {
        return (
            <OverlayBackground onClick={closeModal}>
                <OverlayBox>
                    <Title>You’ve hit your limit for today</Title>
                    <Subtitle>Save and organize your research</Subtitle>
                </OverlayBox>
            </OverlayBackground>
        )
    }
    if (type === 'invitedForCollaboration') {
        return (
            <OverlayBackground onClick={closeModal}>
                <OverlayBox>
                    <Title>You've been invited as a collaborator</Title>
                    <Subtitle>
                        You can now highlight and add notes to this page.
                        <br /> Click anywhere to get started.
                    </Subtitle>
                </OverlayBox>
            </OverlayBackground>
        )
    }
    if (type === 'installMemexForVideo') {
        return (
            <OverlayBackground onClick={closeModal}>
                <OverlayBox>
                    <Title>Supercharge your video based learning</Title>
                    <Subtitle>
                        Install the Memex extension to create video frame
                        snapshots, AI powered smart notes
                        <br /> & summarize videos on the fly
                    </Subtitle>
                    <PrimaryAction
                        onClick={() =>
                            window.open('https://memex.garden', '_blank')
                        }
                        type={'primary'}
                        label={'Download Memex'}
                        size={'large'}
                        icon={getBrowserIcon()}
                        padding={'5px 15px 5px 5px'}
                    />
                </OverlayBox>
            </OverlayBackground>
        )
    }

    return null
}

function getBrowserIcon(): JSX.Element {
    const browserDetect = detect()
    let browserIcon

    /* @ts-ignore */
    if (navigator.brave) {
        browserIcon = require('../../../../assets/img/braveLogo.svg')
        return browserIcon
    }

    switch (browserDetect && browserDetect.name) {
        case 'chrome':
            browserIcon = require('../../../../assets/img/chromeLogo.svg')
            return browserIcon
        case 'firefox':
            browserIcon = require('../../../../assets/img/firefoxLogo.svg')
            return browserIcon
        default:
            // TODO: Fallback case? Default is Chrome link
            browserIcon = require('../../../../assets/img/chromeLogo.svg')
            return browserIcon
    }
}

function getBrowserDownloadLink() {
    const browserDetect = detect()
    let downloadLink

    /* @ts-ignore */
    if (navigator.brave) {
        downloadLink =
            'https://chrome.google.com/webstore/detail/abkfbakhjpmblaafnpgjppbmioombali'

        return downloadLink
    }

    switch (browserDetect && browserDetect.name) {
        case 'chrome':
            return (downloadLink =
                'https://chrome.google.com/webstore/detail/abkfbakhjpmblaafnpgjppbmioombali')
        case 'firefox':
            return (downloadLink =
                'https://addons.mozilla.org/en-US/firefox/addon/worldbrain/')
        default:
            // TODO: Fallback case? Default is Chrome link
            return (downloadLink =
                'https://chrome.google.com/webstore/detail/abkfbakhjpmblaafnpgjppbmioombali')
    }
}
