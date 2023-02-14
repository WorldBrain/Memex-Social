import React from 'react'
import styled, { css } from 'styled-components'
import Overlay from '../../../../main-ui/containers/overlay'
import { ViewportBreakpoint } from '../../../../main-ui/styles/types'
import { Services, UIElementServices } from '../../../../services/types'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { detect } from 'detect-browser'
import { SharedListReference } from '@worldbrain/memex-common/lib/content-sharing/types'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import { Margin } from 'styled-components-spacing'
const bannerImage = require('../../../../assets/img/installBanner.svg')
const sidebarAndHighlights = require('../../../../assets/img/illustrations/sidebarAndHighlights.svg')
const browsingNotifications = require('../../../../assets/img/illustrations/browsingNotifications.svg')

const Content = styled.div<{
    viewportBreakpoint: ViewportBreakpoint
}>`
    max-width: 900px;
    min-width: 900px;
    min-height: 570px;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: row;
    width: 100%;
    grid-gap: 40px;
    padding: 80px 80px 100px 0px;

    ${(props) =>
        props.viewportBreakpoint === 'small' &&
        css`
            max-width: 90%;
            padding: 20px;
            min-width: 600px;
        `}
    ${(props) =>
        props.viewportBreakpoint === 'mobile' &&
        css`
            max-width: 90%;
            padding: 20px;
            min-width: unset;
        `}
`

const Title = styled.div<{
    viewportBreakpoint: ViewportBreakpoint
}>`
    font-weight: 700;
    font-size: 40px;
    background: ${(props) => props.theme.colors.headerGradient};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-align: left;

    ${(props) =>
        props.viewportBreakpoint === 'small' &&
        css`
            font-size: 40px;
        `}
    ${(props) =>
        props.viewportBreakpoint === 'mobile' &&
        css`
            font-size: 32px;
        `}
`

const SupportText = styled.div`
    font-size: 14px;
    background: ${(props) => props.theme.colors.headerGradient};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 500;
    margin-left: 8px;
    white-space: nowrap;
`

const ButtonsBox = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    justify-content: center;
    margin-top: 20px;
    grid-gap: 10px;
`

const TitleContainer = styled.div<{
    viewportBreakpoint: ViewportBreakpoint
}>`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;

    ${(props) =>
        (props.viewportBreakpoint === 'small' ||
            props.viewportBreakpoint === 'mobile') &&
        css`
            align-items: flex-start;
        `}
`
const ContentBox = styled.div<{
    viewportBreakpoint: ViewportBreakpoint
}>`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: space-between;
    height: fill-available;

    ${(props) =>
        props.viewportBreakpoint === 'small' &&
        css`
            padding: 30px;
            align-items: flex-start;
        `}
`

const OverlayContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;

    > * {
        font-family: ${(props) => props.theme.fonts.primary};
    }
`

const BannerImage = styled.div<{
    viewportBreakpoint: ViewportBreakpoint
    backgroundImage: string
}>`
    height: auto;
    min-width: 320px;
    height: 100%;
    background: url(${(props) => props.backgroundImage});
    background-position: center left;
    background-repeat: no-repeat;
    display: flex;
    max-height: 450px;
    background-size: contain;
    margin: 80px 0px;
    ${(props) =>
        (props.viewportBreakpoint === 'mobile' ||
            props.viewportBreakpoint === 'small') &&
        css`
            display: none;
        `};
`

const BenefitList = styled.div`
    display: flex;
    flex-direction: column;
    grid-gap: 20px;
    padding: 30px 0px;
`

const BenefitListEntry = styled.div`
    display: flex;
    align-items: flex-start;
    grid-gap: 10px;
`

const BenefitListEntryContentBox = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    grid-gap: 5px;
`

const BenefitListEntryTitle = styled.div`
    display: flex;
    color: ${(props) => props.theme.colors.greyScale6};
    font-weight: 300;
    font-size: 16px;
    line-height: 28px;
`

const BenefitListEntrySubTitle = styled.div`
    display: flex;
    color: ${(props) => props.theme.colors.greyScale6};
    font-weight: 300;
    font-size: 14px;
`

const PrimaryActionBox = styled.div`
    position: absolute;
    right: 30px;
    bottom: 30px;
`

const LoadingBox = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    grid-gap: 40px;
    font-weight: 300;
    padding: 150px 200px;
    color: ${(props) => props.theme.colors.greyScale6};
    font-size: 18px;
    text-align: center;
    line-height: 27px;
`

const SuccessBox = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    grid-gap: 20px;
    padding: 150px 200px;
`

const SuccessBoxDescription = styled.div`
    color: ${(props) => props.theme.colors.greyScale6};
    font-size: 18px;
    margin-bottom: 20px;
    text-align: center;
    line-height: 27px;
`

const SuccessTitle = styled.div<{
    viewportBreakpoint: ViewportBreakpoint
}>`
    font-weight: 700;
    font-size: 40px;
    background: ${(props) => props.theme.colors.headerGradient};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-align: center;
    line-height: 60px;

    ${(props) =>
        props.viewportBreakpoint === 'small' &&
        css`
            font-size: 40px;
        `}
    ${(props) =>
        props.viewportBreakpoint === 'mobile' &&
        css`
            font-size: 32px;
        `}
`

const ChatGroupList = styled(Margin)`
    display: flex;
    justify-content: center;
    align-items: center;
    grid-gap: 10px;
`

const ChatGroupItem = styled.div`
    display: flex;
    color: ${(props) => props.theme.colors.greyScale5};
    justify-content: center;
    align-items: center;
    grid-gap: 5px;
`

const VideoBox = styled.div`
    width: fill-available;
    height: 0px;
    padding-top: 56.25%;
    position: relative;
    margin-bottom: 20px;
`

const VideoContainer = styled.div<{
    viewportBreakpoint: ViewportBreakpoint
}>`
    width: 800px;
    height: auto;
    padding: 40px;

    ${(props) =>
        props.viewportBreakpoint === 'small' &&
        css`
            height: 100%;
            max-height: 600px;
            max-width: auto;
            width: 100%;
            padding: 20px;
        `}
    ${(props) =>
        props.viewportBreakpoint === 'mobile' &&
        css`
            height: 100%;
            max-height: 600px;
            max-width: auto;
            width: 100%;
            padding: 10px;
        `}
`

const Video = styled.iframe`
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0px;
    left: 0px;
    border-radius: 10px;
    border: none;
`

interface PageAddProps {
    mode: 'add-page'
    intent?: string
}

interface PageClickProps {
    mode: 'click-page'
    clickedPageUrl?: string
}

type Props = {
    services: UIElementServices<'overlay'>
    viewportBreakpoint: ViewportBreakpoint
    intent?: string
    onCloseRequested: () => void
    clickedPageUrl?: string
    sharedListReference?: SharedListReference
} & (PageAddProps | PageClickProps)

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

export default function InstallExtOverlay(props: Props) {
    const [
        extensionDetectionLoadState,
        setExtensionDetectionLoadState,
    ] = React.useState('pristine')
    const [oneMoreThingState, setOneMoreThingState] = React.useState(false)
    const [showVideo, setShowVideo] = React.useState<string>()

    const config = { attributes: true, childList: true }

    const detectExtensionReady = () => {
        console.log('detecting extension')
        const observer = new MutationObserver((mutation) => {
            const targetObject = mutation[0].addedNodes[0]
            if (
                (targetObject as HTMLElement).id ===
                '__memex-ext-installed-detection-element'
            ) {
                setExtensionDetectionLoadState('success')
                observer.disconnect()
            }
        })
        observer.observe(document.body, config)
    }

    if (props.intent === 'openLink') {
        return (
            <>
                <Overlay
                    services={props.services}
                    onCloseRequested={props.onCloseRequested}
                >
                    <OverlayContainer>
                        {showVideo && showVideo?.length ? (
                            <VideoContainer
                                viewportBreakpoint={props.viewportBreakpoint}
                            >
                                <VideoBox>
                                    <Video
                                        allowFullScreen
                                        src={`${showVideo}?autoplay=1`}
                                    />
                                </VideoBox>
                                <ButtonsBox>
                                    <PrimaryAction
                                        onClick={() =>
                                            window.open(
                                                getBrowserDownloadLink(),
                                                '_blank',
                                            )
                                        }
                                        type={'primary'}
                                        label={'Download Memex'}
                                        size={'large'}
                                        icon={getBrowserIcon()}
                                    />
                                    <PrimaryAction
                                        onClick={() =>
                                            window.open(
                                                props.clickedPageUrl,
                                                '_blank',
                                            )
                                        }
                                        label={'Go to Page'}
                                        type={'tertiary'}
                                        size={'large'}
                                        icon={'arrowRight'}
                                        iconPosition={'right'}
                                    />
                                </ButtonsBox>
                            </VideoContainer>
                        ) : (
                            <>
                                <Content
                                    viewportBreakpoint={
                                        props.viewportBreakpoint
                                    }
                                >
                                    <BannerImage
                                        viewportBreakpoint={
                                            props.viewportBreakpoint
                                        }
                                        backgroundImage={sidebarAndHighlights}
                                    />
                                    <ContentBox
                                        viewportBreakpoint={
                                            props.viewportBreakpoint
                                        }
                                    >
                                        <TitleContainer
                                            viewportBreakpoint={
                                                props.viewportBreakpoint
                                            }
                                        >
                                            <Title
                                                viewportBreakpoint={
                                                    props.viewportBreakpoint
                                                }
                                            >
                                                View people’s highlights while
                                                reading
                                            </Title>
                                            <BenefitList>
                                                <BenefitListEntry>
                                                    <Icon
                                                        filePath={'commentAdd'}
                                                        heightAndWidth={'22px'}
                                                        hoverOff
                                                        color="prime1"
                                                    />
                                                    <BenefitListEntryContentBox>
                                                        <BenefitListEntryTitle>
                                                            See the highlights
                                                            and replies on the
                                                            text of the articles
                                                            you’re reading
                                                            without context
                                                            switches.{' '}
                                                        </BenefitListEntryTitle>
                                                    </BenefitListEntryContentBox>
                                                </BenefitListEntry>
                                                <BenefitListEntry>
                                                    <Icon
                                                        filePath={'highlight'}
                                                        heightAndWidth={'22px'}
                                                        hoverOff
                                                        color="prime1"
                                                    />
                                                    <BenefitListEntryContentBox>
                                                        <BenefitListEntryTitle>
                                                            Get notified when
                                                            what you're reading
                                                            is discussed in
                                                            Spaces you follow.{' '}
                                                        </BenefitListEntryTitle>
                                                    </BenefitListEntryContentBox>
                                                </BenefitListEntry>
                                            </BenefitList>
                                        </TitleContainer>
                                        {props.mode === 'click-page' && (
                                            <ButtonsBox>
                                                <PrimaryAction
                                                    onClick={() =>
                                                        setShowVideo(
                                                            'https://share.descript.com/embed/sGbmupT7rMz',
                                                        )
                                                    }
                                                    label={'Watch Demo'}
                                                    type={'forth'}
                                                    size={'large'}
                                                    icon={'play'}
                                                />
                                                <PrimaryAction
                                                    onClick={() =>
                                                        window.open(
                                                            getBrowserDownloadLink(),
                                                            '_blank',
                                                        )
                                                    }
                                                    type={'primary'}
                                                    label={'Download'}
                                                    size={'large'}
                                                    icon={getBrowserIcon()}
                                                />
                                                <SupportText>
                                                    2 clicks to get started
                                                </SupportText>
                                            </ButtonsBox>
                                        )}
                                    </ContentBox>
                                </Content>

                                {props.mode === 'click-page' && (
                                    <PrimaryActionBox>
                                        <PrimaryAction
                                            onClick={() =>
                                                window.open(
                                                    props.clickedPageUrl,
                                                    '_blank',
                                                )
                                            }
                                            label={'...or continue to the page'}
                                            type={'tertiary'}
                                            size={'medium'}
                                            icon={'arrowRight'}
                                            iconPosition={'right'}
                                        />
                                    </PrimaryActionBox>
                                )}
                            </>
                        )}
                    </OverlayContainer>
                </Overlay>
            </>
        )
    }

    if (props.intent === 'follow') {
        return (
            <>
                <Overlay
                    services={props.services}
                    onCloseRequested={props.onCloseRequested}
                >
                    <OverlayContainer>
                        {oneMoreThingState ? (
                            <>
                                {showVideo && showVideo?.length ? (
                                    <VideoContainer
                                        viewportBreakpoint={
                                            props.viewportBreakpoint
                                        }
                                    >
                                        <VideoBox>
                                            <Video
                                                allowFullScreen
                                                src={`${showVideo}?autoplay=1`}
                                            />
                                        </VideoBox>
                                        <ButtonsBox>
                                            <PrimaryAction
                                                onClick={() =>
                                                    window.open(
                                                        'https://links.memex.garden/bots/discord',
                                                        '_blank',
                                                    )
                                                }
                                                type={'primary'}
                                                label={'Install Memex Bot'}
                                                size={'large'}
                                            />
                                            <ChatGroupList>
                                                <ChatGroupItem>
                                                    <Icon
                                                        filePath={'discord'}
                                                        heightAndWidth={'22px'}
                                                        hoverOff
                                                        color="greyScale7"
                                                    />{' '}
                                                    Discord
                                                </ChatGroupItem>
                                            </ChatGroupList>
                                        </ButtonsBox>
                                    </VideoContainer>
                                ) : (
                                    <>
                                        <Content
                                            viewportBreakpoint={
                                                props.viewportBreakpoint
                                            }
                                        >
                                            <BannerImage
                                                viewportBreakpoint={
                                                    props.viewportBreakpoint
                                                }
                                                backgroundImage={
                                                    browsingNotifications
                                                }
                                            />
                                            <ContentBox
                                                viewportBreakpoint={
                                                    props.viewportBreakpoint
                                                }
                                            >
                                                <TitleContainer
                                                    viewportBreakpoint={
                                                        props.viewportBreakpoint
                                                    }
                                                >
                                                    <ChatGroupList bottom="small">
                                                        <ChatGroupItem>
                                                            <Icon
                                                                filePath={
                                                                    'discord'
                                                                }
                                                                heightAndWidth={
                                                                    '22px'
                                                                }
                                                                hoverOff
                                                                color="greyScale7"
                                                            />{' '}
                                                            Discord
                                                        </ChatGroupItem>
                                                    </ChatGroupList>
                                                    <Title
                                                        viewportBreakpoint={
                                                            props.viewportBreakpoint
                                                        }
                                                    >
                                                        Add your chat groups as
                                                        Reading Copilots
                                                    </Title>
                                                    <BenefitList>
                                                        <BenefitListEntry>
                                                            <Icon
                                                                filePath={
                                                                    'commentAdd'
                                                                }
                                                                heightAndWidth={
                                                                    '22px'
                                                                }
                                                                hoverOff
                                                                color="prime1"
                                                            />
                                                            <BenefitListEntryContentBox>
                                                                <BenefitListEntryTitle>
                                                                    All
                                                                    articles,
                                                                    PDFs and
                                                                    Events
                                                                    people
                                                                    posted in
                                                                    your chat
                                                                    group synced
                                                                    into easily
                                                                    digestible
                                                                    Memex
                                                                    Spaces.
                                                                </BenefitListEntryTitle>
                                                            </BenefitListEntryContentBox>
                                                        </BenefitListEntry>
                                                        <BenefitListEntry>
                                                            <Icon
                                                                filePath={
                                                                    'highlight'
                                                                }
                                                                heightAndWidth={
                                                                    '22px'
                                                                }
                                                                hoverOff
                                                                color="prime1"
                                                            />
                                                            <BenefitListEntryContentBox>
                                                                <BenefitListEntryTitle>
                                                                    Get notified
                                                                    when what
                                                                    you're
                                                                    reading was
                                                                    discussed in
                                                                    your chat
                                                                    groups and
                                                                    jump back to
                                                                    the
                                                                    conversation.
                                                                </BenefitListEntryTitle>
                                                            </BenefitListEntryContentBox>
                                                        </BenefitListEntry>
                                                    </BenefitList>
                                                </TitleContainer>
                                                <ButtonsBox>
                                                    <PrimaryAction
                                                        onClick={() =>
                                                            setShowVideo(
                                                                'https://share.descript.com/embed/rWKVpzB3C4u',
                                                            )
                                                        }
                                                        label={'Watch Demo'}
                                                        type={'forth'}
                                                        size={'large'}
                                                        icon={'play'}
                                                    />
                                                    <PrimaryAction
                                                        onClick={() =>
                                                            window.open(
                                                                'https://links.memex.garden/bots/discord',
                                                                '_blank',
                                                            )
                                                        }
                                                        type={'primary'}
                                                        label={'Install Bot'}
                                                        size={'large'}
                                                    />
                                                </ButtonsBox>
                                            </ContentBox>
                                        </Content>
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                {extensionDetectionLoadState === 'running' && (
                                    <LoadingBox>
                                        <LoadingIndicator size={30} />
                                        Waiting for extension to be <br />{' '}
                                        installed and ready
                                    </LoadingBox>
                                )}
                                {extensionDetectionLoadState === 'success' && (
                                    <SuccessBox>
                                        <SuccessTitle
                                            viewportBreakpoint={
                                                props.viewportBreakpoint
                                            }
                                        >
                                            You’re set!
                                            <br />
                                            ...and there is more!
                                        </SuccessTitle>
                                        <SuccessBoxDescription>
                                            Get notified when something you're
                                            reading{' '}
                                            {props.viewportBreakpoint !==
                                                'mobile' && <br />}{' '}
                                            is discussed in your chat groups.
                                        </SuccessBoxDescription>
                                        <PrimaryAction
                                            label={'Sync your chat groups'}
                                            type={'primary'}
                                            onClick={() =>
                                                setOneMoreThingState(true)
                                            }
                                            size={'medium'}
                                        />
                                        <ChatGroupList>
                                            <ChatGroupItem>
                                                <Icon
                                                    filePath={'discord'}
                                                    heightAndWidth={'22px'}
                                                    hoverOff
                                                    color="greyScale7"
                                                />{' '}
                                                Discord
                                            </ChatGroupItem>
                                        </ChatGroupList>
                                    </SuccessBox>
                                )}
                                {extensionDetectionLoadState === 'pristine' && (
                                    <>
                                        {showVideo && showVideo?.length ? (
                                            <VideoContainer
                                                viewportBreakpoint={
                                                    props.viewportBreakpoint
                                                }
                                            >
                                                <VideoBox>
                                                    <Video
                                                        allowFullScreen
                                                        src={`${showVideo}?autoplay=1`}
                                                    />
                                                </VideoBox>
                                                <ButtonsBox>
                                                    <PrimaryAction
                                                        onClick={() => {
                                                            window.open(
                                                                getBrowserDownloadLink(),
                                                                '_blank',
                                                            )
                                                            setExtensionDetectionLoadState(
                                                                'running',
                                                            )
                                                            detectExtensionReady()
                                                        }}
                                                        type={'primary'}
                                                        label={'Download Memex'}
                                                        size={'large'}
                                                        icon={getBrowserIcon()}
                                                    />
                                                </ButtonsBox>
                                            </VideoContainer>
                                        ) : (
                                            <>
                                                <Content
                                                    viewportBreakpoint={
                                                        props.viewportBreakpoint
                                                    }
                                                >
                                                    <BannerImage
                                                        viewportBreakpoint={
                                                            props.viewportBreakpoint
                                                        }
                                                        backgroundImage={
                                                            browsingNotifications
                                                        }
                                                    />
                                                    <ContentBox
                                                        viewportBreakpoint={
                                                            props.viewportBreakpoint
                                                        }
                                                    >
                                                        <TitleContainer
                                                            viewportBreakpoint={
                                                                props.viewportBreakpoint
                                                            }
                                                        >
                                                            <Title
                                                                viewportBreakpoint={
                                                                    props.viewportBreakpoint
                                                                }
                                                            >
                                                                Your community
                                                                as Reading
                                                                Copilots{' '}
                                                            </Title>
                                                            <BenefitList>
                                                                <BenefitListEntry>
                                                                    <Icon
                                                                        filePath={
                                                                            'commentAdd'
                                                                        }
                                                                        heightAndWidth={
                                                                            '22px'
                                                                        }
                                                                        hoverOff
                                                                        color="prime1"
                                                                    />
                                                                    <BenefitListEntryContentBox>
                                                                        <BenefitListEntryTitle>
                                                                            Get
                                                                            notified
                                                                            when
                                                                            what
                                                                            you’re
                                                                            reading
                                                                            is
                                                                            posted,
                                                                            annotated
                                                                            or
                                                                            discussed
                                                                            in
                                                                            Spaces
                                                                            you
                                                                            follow
                                                                        </BenefitListEntryTitle>
                                                                    </BenefitListEntryContentBox>
                                                                </BenefitListEntry>
                                                                <BenefitListEntry>
                                                                    <Icon
                                                                        filePath={
                                                                            'highlight'
                                                                        }
                                                                        heightAndWidth={
                                                                            '22px'
                                                                        }
                                                                        hoverOff
                                                                        color="prime1"
                                                                    />
                                                                    <BenefitListEntryContentBox>
                                                                        <BenefitListEntryTitle>
                                                                            See
                                                                            and
                                                                            reply
                                                                            to
                                                                            the
                                                                            highlights
                                                                            of
                                                                            Spaces
                                                                            you
                                                                            follow
                                                                            while
                                                                            reading
                                                                            articles,
                                                                            videos
                                                                            and
                                                                            PDFs.
                                                                        </BenefitListEntryTitle>
                                                                    </BenefitListEntryContentBox>
                                                                </BenefitListEntry>
                                                            </BenefitList>
                                                        </TitleContainer>
                                                        <ButtonsBox>
                                                            <PrimaryAction
                                                                onClick={() => {
                                                                    setShowVideo(
                                                                        'https://share.descript.com/embed/sGbmupT7rMz',
                                                                    )
                                                                }}
                                                                label={
                                                                    'Watch Demo'
                                                                }
                                                                type={'forth'}
                                                                size={'large'}
                                                                icon={'play'}
                                                            />
                                                            <PrimaryAction
                                                                onClick={() => {
                                                                    window.open(
                                                                        getBrowserDownloadLink(),
                                                                        '_blank',
                                                                    )
                                                                    setExtensionDetectionLoadState(
                                                                        'running',
                                                                    )
                                                                    detectExtensionReady()
                                                                }}
                                                                type={'primary'}
                                                                label={
                                                                    'Download Memex'
                                                                }
                                                                size={'large'}
                                                                icon={getBrowserIcon()}
                                                            />
                                                            <SupportText>
                                                                2 clicks to get
                                                                started
                                                            </SupportText>
                                                        </ButtonsBox>
                                                    </ContentBox>
                                                </Content>
                                            </>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </OverlayContainer>
                </Overlay>
            </>
        )
    }

    return null
}
