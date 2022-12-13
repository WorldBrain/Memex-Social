import React, { ReactElement } from 'react'
import styled, { css } from 'styled-components'
import Overlay from '../../../../main-ui/containers/overlay'
import { ViewportBreakpoint } from '../../../../main-ui/styles/types'
import { UIElementServices } from '../../../../services/types'
import { Margin } from 'styled-components-spacing'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { detect } from 'detect-browser'

const braveLogo = require('../../../../assets/img/braveLogo.svg')
const firefoxLogo = require('../../../../assets/img/logo-firefox.svg')
const chromeLogo = require('../../../../assets/img/logo-chrome.svg')
const bannerImage = require('../../../../assets/img/installBanner.svg')
const noteIcon = require('../../../../assets/img/comment.svg')

const Content = styled.div<{
    viewportBreakpoint: ViewportBreakpoint
}>`
    max-width: 900px;
    min-width: 500px;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: row;
    padding: 40px 40px 10px 40px;
    width: 100%;
    grid-gap: 30px;

    > * {
        font-family: ${(props) => props.theme.fonts.primary};
    }

    ${(props) =>
        props.viewportBreakpoint === 'small' &&
        css`
            max-width: 90%;
            padding: 20px;
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
    font-size: 24px;
    color: ${(props) => props.theme.colors.normalText};
    text-align: left;

    ${(props) =>
        props.viewportBreakpoint === 'small' &&
        css`
            font-size: 18px;
        `}
    ${(props) =>
        props.viewportBreakpoint === 'mobile' &&
        css`
            font-size: 18px;
        `}
`

const ButtonsBox = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    justify-content: center;
    margin-top: 20px;
    grid-gap: 10px;
`

const TitleContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
`
const ContentBox = styled.div<{
    viewportBreakpoint: ViewportBreakpoint
}>`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;

    ${(props) =>
        props.viewportBreakpoint === 'small' &&
        css`
            padding: 30px;
        `}
`

const OverlayContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
`

const BannerImage = styled.img<{ viewportBreakpoint: ViewportBreakpoint }>`
    height: auto;
    max-width: 400px;
    width: fill-available;
    display: flex;

    ${(props) =>
        props.viewportBreakpoint === 'mobile' &&
        css`
            display: none;
        `}
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
    color: ${(props) => props.theme.colors.greyScale9};
    font-weight: 600;
    font-size: 14px;
`

const BenefitListEntrySubTitle = styled.div`
    display: flex;
    color: ${(props) => props.theme.colors.greyScale9};
    font-weight: 300;
    font-size: 14px;
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
} & (PageAddProps | PageClickProps)

function getBrowserIcon(): JSX.Element {
    const browserDetect = detect()
    let browserIcon

    /* @ts-ignore */
    if (navigator.brave) {
        return (browserIcon = require('../../../../assets/img/braveLogo.svg'))
    }

    switch (browserDetect && browserDetect.name) {
        case 'chrome':
            return (browserIcon = require('../../../../assets/img/chromeLogo.svg'))
            break
        case 'firefox':
            return (browserIcon = require('../../../../assets/img/firefoxLogo.svg'))
            break
        default:
            // TODO: Fallback case? Default is Chrome link
            return (browserIcon = require('../../../../assets/img/chromeLogo.svg'))
            break
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
            break
        case 'firefox':
            return (downloadLink =
                'https://addons.mozilla.org/en-US/firefox/addon/worldbrain/')
            break
        default:
            // TODO: Fallback case? Default is Chrome link
            return (downloadLink =
                'https://chrome.google.com/webstore/detail/abkfbakhjpmblaafnpgjppbmioombali')
            break
    }
}

export default function InstallExtOverlay(props: Props) {
    if (props.intent === 'openLink') {
        return (
            <>
                <Overlay
                    services={props.services}
                    onCloseRequested={props.onCloseRequested}
                >
                    <OverlayContainer>
                        <Content viewportBreakpoint={props.viewportBreakpoint}>
                            <BannerImage
                                viewportBreakpoint={props.viewportBreakpoint}
                                src={bannerImage}
                            />
                            <ContentBox
                                viewportBreakpoint={props.viewportBreakpoint}
                            >
                                <TitleContainer>
                                    <Title
                                        viewportBreakpoint={
                                            props.viewportBreakpoint
                                        }
                                    >
                                        Download the Memex extension for an
                                        enhanced reading experience
                                    </Title>
                                    <BenefitList>
                                        <BenefitListEntry>
                                            <Icon
                                                filePath={'commentEmpty'}
                                                heightAndWidth={'22px'}
                                                hoverOff
                                                color="purple"
                                            />
                                            <BenefitListEntryContentBox>
                                                <BenefitListEntryTitle>
                                                    Tap into your community's
                                                    knowledge while browsing
                                                </BenefitListEntryTitle>
                                                <BenefitListEntrySubTitle>
                                                    See when pages you're
                                                    reading are annotated in
                                                    Spaces you follow
                                                </BenefitListEntrySubTitle>
                                            </BenefitListEntryContentBox>
                                        </BenefitListEntry>
                                        <BenefitListEntry>
                                            <Icon
                                                filePath={'highlight'}
                                                heightAndWidth={'22px'}
                                                hoverOff
                                                color="purple"
                                            />
                                            <BenefitListEntryContentBox>
                                                <BenefitListEntryTitle>
                                                    Highlights, notes and
                                                    conversations across the web
                                                </BenefitListEntryTitle>
                                                <BenefitListEntrySubTitle>
                                                    View, make & share
                                                    highlights on websites,
                                                    videos and PDFs
                                                </BenefitListEntrySubTitle>
                                            </BenefitListEntryContentBox>
                                        </BenefitListEntry>
                                        <BenefitListEntry>
                                            <Icon
                                                filePath={'heartEmpty'}
                                                heightAndWidth={'22px'}
                                                hoverOff
                                                color="purple"
                                            />
                                            <BenefitListEntryContentBox>
                                                <BenefitListEntryTitle>
                                                    Powerful bookmarking
                                                </BenefitListEntryTitle>
                                                <BenefitListEntrySubTitle>
                                                    Save anything with one click
                                                    and find it again in seconds
                                                </BenefitListEntrySubTitle>
                                            </BenefitListEntryContentBox>
                                        </BenefitListEntry>
                                    </BenefitList>
                                </TitleContainer>
                                {props.mode === 'click-page' && (
                                    <ButtonsBox>
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
                                        <PrimaryAction
                                            onClick={() =>
                                                window.open(
                                                    props.clickedPageUrl,
                                                    '_blank',
                                                )
                                            }
                                            label={'Watch Demo'}
                                            type={'forth'}
                                            size={'large'}
                                            icon={'play'}
                                        />
                                    </ButtonsBox>
                                )}
                            </ContentBox>
                        </Content>
                        {props.mode === 'click-page' && (
                            <PrimaryAction
                                onClick={() =>
                                    window.open(props.clickedPageUrl, '_blank')
                                }
                                label={'...or continue to the page'}
                                type={'tertiary'}
                                size={'medium'}
                                icon={'arrowRight'}
                                iconPosition={'right'}
                            />
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
                        <Content viewportBreakpoint={props.viewportBreakpoint}>
                            <BannerImage
                                viewportBreakpoint={props.viewportBreakpoint}
                                src={bannerImage}
                            />
                            <ContentBox
                                viewportBreakpoint={props.viewportBreakpoint}
                            >
                                <TitleContainer>
                                    <Title
                                        viewportBreakpoint={
                                            props.viewportBreakpoint
                                        }
                                    >
                                        Download Memex to see annotations of
                                        Spaces you follow when reading online
                                    </Title>
                                    <BenefitList>
                                        <BenefitListEntry>
                                            <Icon
                                                filePath={'commentEmpty'}
                                                heightAndWidth={'22px'}
                                                hoverOff
                                                color="purple"
                                            />
                                            <BenefitListEntryContentBox>
                                                <BenefitListEntryTitle>
                                                    Tap into your community's
                                                    knowledge while browsing
                                                </BenefitListEntryTitle>
                                                <BenefitListEntrySubTitle>
                                                    See when pages you're
                                                    reading are annotated in
                                                    Spaces you follow
                                                </BenefitListEntrySubTitle>
                                            </BenefitListEntryContentBox>
                                        </BenefitListEntry>
                                        <BenefitListEntry>
                                            <Icon
                                                filePath={'highlight'}
                                                heightAndWidth={'22px'}
                                                hoverOff
                                                color="purple"
                                            />
                                            <BenefitListEntryContentBox>
                                                <BenefitListEntryTitle>
                                                    Highlights, notes and
                                                    conversations across the web
                                                </BenefitListEntryTitle>
                                                <BenefitListEntrySubTitle>
                                                    View, make & share
                                                    highlights on websites,
                                                    videos and PDFs
                                                </BenefitListEntrySubTitle>
                                            </BenefitListEntryContentBox>
                                        </BenefitListEntry>
                                        <BenefitListEntry>
                                            <Icon
                                                filePath={'heartEmpty'}
                                                heightAndWidth={'22px'}
                                                hoverOff
                                                color="purple"
                                            />
                                            <BenefitListEntryContentBox>
                                                <BenefitListEntryTitle>
                                                    Powerful bookmarking
                                                </BenefitListEntryTitle>
                                                <BenefitListEntrySubTitle>
                                                    Save anything with one click
                                                    and find it again in seconds
                                                </BenefitListEntrySubTitle>
                                            </BenefitListEntryContentBox>
                                        </BenefitListEntry>
                                    </BenefitList>
                                </TitleContainer>
                                {props.mode === 'click-page' && (
                                    <ButtonsBox>
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
                                        <PrimaryAction
                                            onClick={() =>
                                                window.open(
                                                    props.clickedPageUrl,
                                                    '_blank',
                                                )
                                            }
                                            label={'Watch Demo'}
                                            type={'forth'}
                                            size={'large'}
                                            icon={'play'}
                                        />
                                    </ButtonsBox>
                                )}
                            </ContentBox>
                        </Content>
                        {props.mode === 'click-page' && (
                            <PrimaryAction
                                onClick={() =>
                                    window.open(props.clickedPageUrl, '_blank')
                                }
                                label={'...or continue to the page'}
                                type={'tertiary'}
                                size={'medium'}
                                icon={'arrowRight'}
                                iconPosition={'right'}
                            />
                        )}
                    </OverlayContainer>
                </Overlay>
            </>
        )
    }

    return null
}
