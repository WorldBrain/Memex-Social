import React from 'react'
import styled, { css } from 'styled-components'
import { UIElement } from '../../classes'
import Logic from './logic'
import type {
    LandingPageDependencies,
    LandingPageState,
    LandingPageEvent,
} from './types'
import LoadingIndicator from '../../../common-ui/components/loading-indicator'
import TextField from '@worldbrain/memex-common/lib/common-ui/components/text-field'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { detect } from 'detect-browser'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'

interface LandingPageProps extends LandingPageDependencies {}

const Container = styled.div`
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
`
const memexLogo = require('../../../assets/img/memex-logo-beta.svg')

const BookmarkletCode = `javascript:(function() {
    const baseUrl = 'https://memex.social/new?url=';
    const currentUrl = encodeURIComponent(window.location.href);
    const newUrl = baseUrl + currentUrl;
    window.open(newUrl, '_blank');
  })();`
export default class LandingPage extends UIElement<
    LandingPageProps,
    LandingPageState,
    LandingPageEvent
> {
    constructor(props: LandingPageProps) {
        super(props, { logic: new Logic(props) })
        document.body.style.overflow = 'hidden' // Add this line to hide the scrollbar
    }

    render() {
        return (
            <Container>
                <Logo src={memexLogo} />
                {this.state.linkCreationState === 'running' ? (
                    <MainContainer>
                        <>
                            <Title>Preparing conversation</Title>
                            <SubTitle>Just a moment 🤙🏻</SubTitle>
                        </>
                        <LoadingIndicator />
                    </MainContainer>
                ) : (
                    <MainContainer>
                        <TitleBox>
                            <Title>
                                Wanna share a bunch of notes on <br />a website,
                                PDF or YouTube video?
                            </Title>
                            <SubTitle>
                                Instantly share a link to highlight & discuss
                                them with the ease of working on a Google Doc
                            </SubTitle>
                        </TitleBox>
                        <AddNewBox>
                            <TextField
                                placeholder="Paste public URL of website, PDF or YouTube video"
                                onChange={(e) =>
                                    this.processEvent('newUrlInputChanged', {
                                        newUrlInputValue: (e.target as HTMLInputElement)
                                            .value,
                                    })
                                }
                                onKeyDown={(e) => {
                                    if (
                                        e.key === 'Enter' &&
                                        this.state.isValidUrl
                                    ) {
                                        this.processEvent(
                                            'handleURLtoProcess',
                                            {
                                                url: this.state
                                                    .newUrlInputValue,
                                            },
                                        )
                                    }
                                }}
                                value={this.state.newUrlInputValue}
                                autoFocus
                                fontSize="16px"
                                background="black0"
                            />
                            {this.state.isValidUrl ? (
                                <PrimaryActionBox>
                                    <PrimaryAction
                                        onClick={() =>
                                            this.processEvent(
                                                'handleURLtoProcess',
                                                {
                                                    url: this.state
                                                        .newUrlInputValue,
                                                },
                                            )
                                        }
                                        type={'primary'}
                                        label={
                                            'Create annotateable & shareable link for this URL'
                                        }
                                        size={'large'}
                                        width={'100%'}
                                        icon={'longArrowRight'}
                                        iconPosition="right"
                                        padding={'5px 15px 5px 5px'}
                                    />
                                </PrimaryActionBox>
                            ) : (
                                <NewPDFArea
                                    fileDragState={this.state.fileDragState}
                                    onDrop={(
                                        e: React.DragEvent<HTMLDivElement>,
                                    ) => {
                                        e.preventDefault()
                                        const files = e.dataTransfer.files
                                        if (files.length > 0) {
                                            const file = files[0]
                                            if (
                                                file.type === 'application/pdf'
                                            ) {
                                                file.arrayBuffer().then(
                                                    (arrayBuffer) => {
                                                        const blob = new Blob(
                                                            [arrayBuffer],
                                                            {
                                                                type:
                                                                    'application/pdf',
                                                            },
                                                        )

                                                        this.processEvent(
                                                            'handlePDFBlob',
                                                            {
                                                                file: blob,
                                                            },
                                                        )
                                                    },
                                                )
                                            }
                                        }
                                        this.processEvent('setFileDragState', {
                                            fileDragState: false,
                                        })
                                    }}
                                    onClick={() => {
                                        const input = document.createElement(
                                            'input',
                                        )
                                        input.type = 'file'
                                        input.accept = 'application/pdf'
                                        input.onchange = (e: Event) => {
                                            const file = (e.target as HTMLInputElement)
                                                .files?.[0]
                                            if (file) {
                                                file.arrayBuffer().then(
                                                    (arrayBuffer) => {
                                                        const blob = new Blob(
                                                            [arrayBuffer],
                                                            {
                                                                type:
                                                                    'application/pdf',
                                                            },
                                                        )
                                                        return this.processEvent(
                                                            'handlePDFBlob',
                                                            {
                                                                file: blob,
                                                            },
                                                        )
                                                    },
                                                )
                                            }
                                        }
                                        input.click()
                                    }}
                                    onMouseEnter={() => {
                                        this.processEvent(
                                            'setFileAreaHoverState',
                                            {
                                                fileAreaHoverState: true,
                                            },
                                        )
                                    }}
                                    onMouseLeave={() => {
                                        this.processEvent(
                                            'setFileAreaHoverState',
                                            {
                                                fileAreaHoverState: false,
                                            },
                                        )
                                    }}
                                    onDragOver={(
                                        e: React.DragEvent<HTMLDivElement>,
                                    ) => {
                                        e.preventDefault()
                                        this.processEvent('setFileDragState', {
                                            fileDragState: true,
                                        })
                                    }}
                                    onDragLeave={(
                                        e: React.DragEvent<HTMLDivElement>,
                                    ) => {
                                        e.preventDefault()
                                        this.processEvent('setFileDragState', {
                                            fileDragState: false,
                                        })
                                    }}
                                >
                                    <IconBox>
                                        <Icon
                                            filePath={'longArrowRight'}
                                            rotation={90}
                                            heightAndWidth="30px"
                                            color="prime1"
                                            hoverOff
                                        />
                                    </IconBox>
                                    {this.state.fileAreaHoverState
                                        ? 'Click to select file'
                                        : 'Drop PDF here'}
                                </NewPDFArea>
                            )}
                        </AddNewBox>
                        <BottomContainer
                            onMouseLeave={() => {
                                this.processEvent(
                                    'switchToBookmarkletText',
                                    false,
                                )
                                this.processEvent(
                                    'switchToExtensionDownloadText',
                                    false,
                                )
                            }}
                        >
                            {this.state.showBookmarkletText && (
                                <DragBookmarkletBox>
                                    <DragBookmarkletText>
                                        Drag me into the bookmarks bar and click
                                        while on any public url
                                    </DragBookmarkletText>
                                    <DragBookmarkletHiddenText
                                        onClick={(
                                            e: React.MouseEvent<HTMLAnchorElement>,
                                        ) => e.preventDefault()}
                                        href={BookmarkletCode}
                                        onDragStart={(
                                            e: React.DragEvent<HTMLAnchorElement>,
                                        ) => {
                                            setTimeout(() => {
                                                this.processEvent(
                                                    'switchToBookmarkletText',
                                                    false,
                                                )
                                            }, 6000)
                                        }}
                                    >
                                        Memex New
                                    </DragBookmarkletHiddenText>
                                </DragBookmarkletBox>
                            )}
                            {this.state.showExtensionDownloadText && (
                                <DownloadExtensionTextBox
                                    onClick={() =>
                                        window.open(
                                            getBrowserDownloadLink(),
                                            '_blank',
                                        )
                                    }
                                >
                                    Download for
                                    <BrowserIcon icon={getBrowserIcon()} />
                                </DownloadExtensionTextBox>
                            )}
                            {!this.state.showBookmarkletText &&
                                !this.state.showExtensionDownloadText && (
                                    <DefaultTextBox>
                                        Add the{' '}
                                        <ActionInText
                                            onMouseEnter={() => {
                                                this.processEvent(
                                                    'switchToBookmarkletText',
                                                    true,
                                                )
                                            }}
                                        >
                                            bookmarklet
                                        </ActionInText>{' '}
                                        or the{' '}
                                        <ActionInText
                                            onMouseEnter={() => {
                                                this.processEvent(
                                                    'switchToExtensionDownloadText',
                                                    true,
                                                )
                                            }}
                                        >
                                            browser extension
                                        </ActionInText>{' '}
                                        to create links with 1-click while
                                        browsing
                                    </DefaultTextBox>
                                )}
                        </BottomContainer>
                    </MainContainer>
                )}
            </Container>
        )
    }
}

function getBrowserIcon(): string {
    const browserDetect = detect()
    let browserIcon

    /* @ts-ignore */
    if (navigator.brave) {
        browserIcon = require('../../../assets/img/braveLogo.svg')
        return browserIcon
    }

    switch (browserDetect && browserDetect.name) {
        case 'chrome':
            browserIcon = '../../../assets/img/chromeLogo.svg'
            return browserIcon
        case 'firefox':
            browserIcon = '../../../assets/img/firefoxLogo.svg'
            return browserIcon
        default:
            // TODO: Fallback case? Default is Chrome link
            browserIcon = '../../../assets/img/chromeLogo.svg'
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

const Logo = styled.img`
    height: 40px;
    position: absolute;
    top: 15px;
    left: 20px;
`

const IconBox = styled.div`
    animation: wiggle 3s ease-in-out infinite;

    @keyframes wiggle {
        25% {
            transform: translateY(10px);
        }
        50% {
            transform: translateY(0);
        }
        75% {
            transform: translateY(10px);
        }
    }
`

const TitleBox = styled.div`
    display: flex;
    flex-direction: column;
    grid-gap: 10px;
    align-items: center;
    justify-content: center;
    animation: slideUpAndFadeIn 500ms ease-in-out;

    @keyframes slideUpAndFadeIn {
        from {
            transform: translateY(30px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
`

const AddNewBox = styled.div`
    min-width: 300px;
    max-width: 800px;
    width: 90%;
    height: fit-content;
    display: flex;
    align-items: center;
    flex-direction: column;
    grid-gap: 20px;
    justify-content: center;
    animation: slideUpAndFadeIn 500ms ease-in-out 300ms forwards;
    opacity: 0; /* Start as invisible */

    @keyframes slideUpAndFadeIn {
        from {
            transform: translateY(50px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
`
const ActionBoxHeight = '150px'
const PrimaryActionBox = styled.div`
    height: ${ActionBoxHeight};
    width: 100%;
`

const NewPDFArea = styled.div<{ fileDragState: boolean }>`
    border: 1px dashed ${(props) => props.theme.colors.greyScale4};
    border-radius: 5px;
    padding: 50px;
    height: ${ActionBoxHeight};
    width: 100%;
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
    font-size: 20px;
    grid-gap: 15px;
    color: ${(props) => props.theme.colors.greyScale5};
    cursor: pointer;
    :hover {
        opacity: 0.8;
        border: 1px dashed ${(props) => props.theme.colors.prime1};
    }
    ${(props) =>
        props.fileDragState &&
        css`
            border: 1px dashed ${props.theme.colors.prime1};
        `}

    font-size: 1.2rem;
    @media (max-width: 1200px) {
        font-size: 1.2rem;
    }

    @media (max-width: 992px) {
        font-size: 1.2rem;
    }

    @media (max-width: 768px) {
        font-size: 1rem;
    }

    @media (max-width: 576px) {
        font-size: 1rem;
    }
`

const MainContainer = styled.div`
    display: flex;
    flex-direction: column;
    grid-gap: 10px;
    align-items: center;
    justify-content: center;

    &::-webkit-scrollbar {
        display: none;
    }

    scrollbar-width: none;

    overflow: scroll;
    padding: 50px;
`

const Title = styled.div`
    background: ${(props) => props.theme.colors.headerGradient};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-align: center;
    font-size: 3.5rem;
    text-align: center;
    font-weight: 900;
    @media (max-width: 1200px) {
        font-size: 3rem;
    }

    @media (max-width: 992px) {
        font-size: 2.5rem;
    }

    @media (max-width: 768px) {
        font-size: 2rem;
    }

    @media (max-width: 576px) {
        font-size: 1.5rem;
    }
`
const SubTitle = styled.div`
    color: ${(props) => props.theme.colors.greyScale6};
    margin-bottom: 40px;
    font-weight: 300;
    text-align: center;

    font-size: 1.5rem;
    @media (max-width: 1200px) {
        font-size: 1.5rem;
    }

    @media (max-width: 992px) {
        font-size: 1.2rem;
    }

    @media (max-width: 768px) {
        font-size: 1rem;
    }

    @media (max-width: 576px) {
        font-size: 1rem;
    }
`

const BottomContainer = styled.div`
    display: flex;
    position: absolute;
    bottom: 0px;

    width: 100%;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${(props) => props.theme.colors.black}95;
    backdrop-filter: blur(10px);

    animation: slideUpAndFadeIn2 500ms ease-in-out 600ms forwards;
    opacity: 0; /* Start as invisible */

    @keyframes slideUpAndFadeIn2 {
        from {
            transform: translateY(200px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
`

const DefaultTextBox = styled.div`
    background: ${(props) => props.theme.colors.headerGradient};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-align: center;
    font-size: 1.3rem;
    text-align: center;
    font-weight: 300;
    display: flex;
    grid-gap: 5px;
    letter-spacing: 1px;
    @media (max-width: 1200px) {
        font-size: 1.3rem;
        line-height: 1.3rem;
    }

    @media (max-width: 992px) {
        font-size: 1rem;
        line-height: 1rem;
    }

    @media (max-width: 768px) {
        font-size: 0.9rem;
        line-height: 0.9rem;
        white-space: nowrap;
        flex-wrap: wrap;
        text-align: center;
        justify-content: center;
        align-items: center;
        margin-bottom: 18px;
    }

    @media (max-width: 576px) {
        font-size: 0.9rem;
        line-height: 0.9rem;
        flex-wrap: wrap;
        text-align: center;
        justify-content: center;
        align-items: center;
        margin-bottom: 18px;
    }
`

const DragBookmarkletBox = styled(DefaultTextBox).attrs({ as: 'a' })`
    position: relative;
`
const DragBookmarkletHiddenText = styled.a`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    color: transparent;
    background: transparent;
`

const DragBookmarkletText = styled(DefaultTextBox)`
    cursor: pointer;
`
const DownloadExtensionTextBox = styled(DefaultTextBox)`
    display: flex;
    align-items: center;
    justify-content: center;
    grid-gap: 5px;
    cursor: pointer;
`

const ActionInText = styled.span`
    font-weight: 500;
    cursor: pointer;

    &:after {
        content: '';
        display: block;
        width: 100%;
        height: 1px;
        background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 1) 0%,
            rgba(0, 212, 255, 1) 100%
        );
        margin-top: 2px;
    }
`

const BrowserIcon = styled.img<{
    icon: string
}>`
    height: 24px;
    width: 24px;
    /* Use the src prop as the source for the mask image */
    mask-image: url(${(props) => props.icon});
    mask-size: cover; /* Ensure the mask covers the whole element */
    mask-position: center; /* Center the mask image */
    mask-repeat: no-repeat; /* Prevent the mask image from repeating */
    background-color: ${(props) =>
        props.theme.colors
            .prime1}; /* This color will be visible where the mask is transparent */
    /* Add these for cross-browser compatibility */
    -webkit-mask-image: url(${(props) => props.icon});
    -webkit-mask-size: cover;
    -webkit-mask-position: center;
    -webkit-mask-repeat: no-repeat;
    display: block; /* Change from img to a block element to better control rendering */
`
