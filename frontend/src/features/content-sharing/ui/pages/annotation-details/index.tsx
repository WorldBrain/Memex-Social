import moment from 'moment'
import React from 'react'
import styled, { css } from 'styled-components'
import { UIElement } from '../../../../../main-ui/classes'
import Logic, { AnnotationDetailsState } from './logic'
import { AnnotationDetailsEvent, AnnotationDetailsDependencies } from './types'
import DocumentTitle from '../../../../../main-ui/components/document-title'
import DefaultPageLayout from '../../../../../common-ui/layouts/default-page-layout'
import LoadingIndicator from '../../../../../common-ui/components/loading-indicator'
import ErrorWithAction from '../../../../../common-ui/components/error-with-action'
import Markdown from '../../../../../common-ui/components/markdown'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
const logoImage = require('../../../../../assets/img/memex-logo.svg')
const iconImage = require('../../../../../assets/img/memex-icon.svg')

export default class AnnotationDetailsPage extends UIElement<
    AnnotationDetailsDependencies,
    AnnotationDetailsState,
    AnnotationDetailsEvent
> {
    constructor(props: AnnotationDetailsDependencies) {
        super(props, { logic: new Logic(props) })
    }

    isIframe = () => {
        try {
            return window.self !== window.top
        } catch (e) {
            return true
        }
    }

    getBreakPoints() {
        let viewPortWidth = this.getViewportWidth()

        if (viewPortWidth <= 500) {
            return 'mobile'
        }

        if (viewPortWidth >= 500 && viewPortWidth <= 850) {
            return 'small'
        }

        if (viewPortWidth > 850) {
            return 'big'
        }

        return 'normal'
    }

    getAnnotationText = (annotationBody: string) => {
        const tempDivElement = document.createElement('div')
        tempDivElement.innerHTML = annotationBody ?? ''
        const text =
            tempDivElement.textContent || tempDivElement.innerText || ''

        const textArray = text
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
            .split(' ')

        let firstWords
        let lastWords
        if (textArray.length < 7) {
            firstWords = textArray.slice(0, 2).join(' ')
            lastWords = textArray.slice(-3).join(' ')
        } else {
            firstWords = textArray.slice(0, 3).join(' ')
            lastWords = textArray.slice(-4).join(' ')
        }

        return `${firstWords},${lastWords}`
    }

    render() {
        const viewportWidth = this.getBreakPoints()

        const { state } = this

        if (
            state.annotationLoadState === 'pristine' ||
            state.annotationLoadState === 'running'
        ) {
            return (
                <LoadingScreen viewportWidth={viewportWidth}>
                    <LoadingIndicator />
                </LoadingScreen>
            )
        }
        if (state.annotationLoadState === 'error') {
            return (
                <DefaultPageLayout
                    services={this.props.services}
                    storage={this.props.storage}
                    viewportBreakpoint={viewportWidth}
                    headerTitle={'Annotation'}
                >
                    <ErrorWithAction errorType="internal-error">
                        Error loading note. <br /> Reload page to retry.
                    </ErrorWithAction>
                </DefaultPageLayout>
            )
        }

        const { annotation, creator, pageInfo } = state
        if (!annotation) {
            return (
                <DefaultPageLayout
                    services={this.props.services}
                    storage={this.props.storage}
                    viewportBreakpoint={viewportWidth}
                    headerTitle={'Annotation'}
                >
                    <ErrorWithAction
                        errorType="not-found"
                        action={{
                            label: 'Create your first collection',
                            url: 'https://getmemex.com',
                        }}
                    >
                        Could not find the not you were looking for. Maybe
                        somebody shared it, but then removed it again?
                    </ErrorWithAction>
                </DefaultPageLayout>
            )
        }

        return (
            <>
                <DocumentTitle
                    documentTitle={this.props.services.documentTitle}
                    subTitle={`Shared note${
                        creator ? ` by ${creator.displayName}` : ''
                    }`}
                />
                <AnnotationPage isIframe={this.isIframe()}>
                    {!this.isIframe() && (
                        <IntroArea>
                            <LogoLinkArea
                                href={'https://memex.garden'}
                                target={'_blank'}
                            >
                                <MemexLogo />
                            </LogoLinkArea>
                        </IntroArea>
                    )}
                    <AnnotationContainer>
                        {this.isIframe() && (
                            <IntroArea isIframe>
                                <LogoLinkArea
                                    href={'https://memex.garden'}
                                    target={'_blank'}
                                >
                                    <MemexLogo isIframe />
                                </LogoLinkArea>
                            </IntroArea>
                        )}
                        <AnnotationTopBox>
                            {annotation.body && (
                                <HighlightBox>
                                    <HighlightBar />
                                    <HighlightContainer>
                                        <MarkdownBox isHighlight>
                                            {annotation.body}
                                        </MarkdownBox>
                                    </HighlightContainer>
                                </HighlightBox>
                            )}
                            {annotation.comment && (
                                <AnnotationComment
                                    hasHighlight={!!annotation.body}
                                >
                                    <Markdown
                                    // contextLocation={props.contextLocation}
                                    // getYoutubePlayer={
                                    //     props.getYoutubePlayer
                                    // }
                                    >
                                        {annotation.comment}
                                    </Markdown>
                                </AnnotationComment>
                            )}
                        </AnnotationTopBox>
                        <AnnotationFooter>
                            {state.pageInfoLoadState === 'error' && (
                                <AnnotationFooterError>
                                    Could not load page URL and title
                                </AnnotationFooterError>
                            )}
                            {state.pageInfoLoadState === 'running' && (
                                <LoadingIndicatorBox>
                                    <LoadingIndicator />
                                </LoadingIndicatorBox>
                            )}
                            {state.pageInfoLoadState === 'success' && (
                                <>
                                    {!pageInfo && (
                                        <div>
                                            Could not find page URL and title
                                        </div>
                                    )}
                                    {pageInfo && (
                                        <>
                                            <AnnotationFooterLeft>
                                                <AnnotationPageTitle>
                                                    {pageInfo.fullTitle}
                                                </AnnotationPageTitle>
                                                <AnnotationPageUrl>
                                                    {pageInfo.originalUrl}
                                                </AnnotationPageUrl>
                                            </AnnotationFooterLeft>
                                            <AnnotationFooterRight>
                                                <OpenButton
                                                    target="_blank"
                                                    href={
                                                        pageInfo.originalUrl +
                                                        '#:~:text=' +
                                                        this.getAnnotationText(
                                                            annotation.body ??
                                                                '',
                                                        )
                                                    }
                                                >
                                                    Open Link
                                                    <Icon
                                                        icon="arrowRight"
                                                        heightAndWidth="22px"
                                                        hoverOff
                                                    />
                                                </OpenButton>
                                            </AnnotationFooterRight>
                                        </>
                                    )}
                                </>
                            )}
                        </AnnotationFooter>
                    </AnnotationContainer>
                    <OutroArea></OutroArea>
                </AnnotationPage>
            </>
        )
    }
}

const AnnotationTopBox = styled.div`
    display: flex;
    flex-direction: column;
    padding: 15px 15px 5px 15px;
`

const IntroArea = styled.div<{ isIframe?: boolean }>`
    display: flex;
    justify-content: center;
    margin: 10px 15px 10px 15px;
    flex-direction: column;
    align-items: center;
    width: 100%;
    position: relative;

    ${(props) =>
        props.isIframe &&
        css`
            align-items: flex-end;
            margin: 0px;
        `};
`

const LogoLinkArea = styled.a`
    position: relative;
    cursor: pointer;
    z-index: 1;
`

const MemexLogo = styled.div<{ isIframe?: boolean }>`
    height: 30px;
    background-position: center;
    background-size: contain;
    width: 130px;
    border: none;
    cursor: pointer;
    margin-right: 20px;
    background-repeat: no-repeat;
    background-image: url(${logoImage});
    display: flex;

    ${(props) =>
        props.isIframe &&
        css`
            width: 22px;
            position: absolute;
            right: 15px;
            top: 10px;
            margin-right: 0px;
            background-image: url(${iconImage});
        `};
`

const OpenButton = styled.a<{}>`
    padding: 5px 5px 5px 15px;
    text-decoration: none;
    display: flex;
    grid-gap: 5px;
    align-items: center;
    border-radius: 6px;

    ${(props) =>
        css`
            color: ${(props) => props.theme.colors.white};
            background: ${(props) => props.theme.colors.greyScale2};

            &:hover {
                background: ${(props) => props.theme.colors.greyScale3};
            }
        `};
`

const AnnotationPage = styled.div<{ isIframe: boolean }>`
    display: flex;
    align-items: center;
    height: fit-content;
    flex-direction: column;
    justify-content: flex-start;
    padding-top: 10vh;
    padding-bottom: 10vh;

    & div {
        font-family: ${(props) => props.theme.fonts.primary};
    }

    ${(props) =>
        props.isIframe &&
        css`
            padding: 0;
        `};
`

// const AnnotationContainer = styled.div`
//     width: 90%;
//     max-width: 550px;
//     margin-bottom: 25vh;

//     background: #ffffff;
//     border: 1.72269px solid rgba(0, 0, 0, 0.1);
//     box-sizing: border-box;
//     box-shadow: 0px 3.72px 27px rgba(0, 0, 0, 0.1);
//     border-radius: 8.61345px;
// `
const AnnotationContentBox = styled.div`
    padding: 15px 15px 10px 15px;
`

const AnnotationBody = styled.span`
    font-family: ${(props) => props.theme.fonts.primary};
    font-weight: normal;
    line-height: 26px;
    background-color: #d4e8ff;
    white-space: normal;
    padding: 0 5px;
    box-decoration-break: clone;
    font-size: 16px;
    color: ${(props) => props.theme.colors.prime1};
`
const AnnotationComment = styled.div<{
    hasHighlight: boolean
}>`
    font-size: 14px;
    color: ${(props) => props.theme.colors.white};
    padding: 15px 20px;

    ${(props) =>
        props.hasHighlight &&
        css`
            padding: 0px 20px 15px 20px;
        `}

    & *:first-child {
        margin-top: 0;
    }

    & *:last-child {
        margin-bottom: 0;
    }

    & * {
        word-break: break-word;
    }
`

const AnnotationFooter = styled.div`
    border-top: 1px solid ${(props) => props.theme.colors.greyScale3};
    padding: 15px 15px 15px 30px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 70px;
`

const LoadingIndicatorBox = styled.div`
    display: flex;
    justify-content: center;
    width: 100%;
`

const AnnotationFooterRight = styled.div`
    width: fit-content;
`
const AnnotationFooterLeft = styled.div`
    flex: 1;
    width: 50%;
    padding-right: 20px;
    grid-gap: 5px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
`
const AnnotationFooterError = styled.div``

const AnnotationPageTitle = styled.div`
    font-family: ${(props) => props.theme.fonts.primary};
    color: ${(props) => props.theme.colors.white};
    font-weight: 600;
    font-size: 14px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow-wrap: break-word;
    overflow-x: hidden;
    width: 100%;
`

const AnnotationPageUrl = styled.div`
    font-family: ${(props) => props.theme.fonts.primary};
    color: ${(props) => props.theme.colors.greyScale5};
    width: 355px;
    font-size: 14px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow-wrap: break-word;
    overflow-x: hidden;
    width: 100%;
`

const GoToAnnotationButton = styled.a`
    border-radius: 5px;
    background-color: ${(props) => props.theme.colors.prime1};
    color: ${(props) => props.theme.colors.white};
    height: 36px;
    padding: 8px 16px;
    width: fit-content;
    white-space: nowrap;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 14px;
    font-weight: bold;
    text-decoration: none;
`
const OutroArea = styled.div`
    display: flex;
    justify-content: center;
`

const LoadingScreen = styled.div<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
}>`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    width: 100%;
`

const AnnotationContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    max-width: 500px;
    border: 1px solid ${(props) => props.theme.colors.greyScale2};
    border-radius: 8px;
`

const MarkdownBox = styled(Markdown)`
    flex: 1;
    margin-left: 20px;
`

const HighlightContainer = styled.div`
    margin-left: 20px;
`

const HighlightBox = styled.div`
    display: flex;
    align-items: center;
    padding: 15px 15px 15px 15px;
    width: 100%;
    position: relative;
    height: fill-available;
`

const HighlightBar = styled.div`
    background-color: ${(props) => props.theme.colors.prime1};
    margin-right: 10px;
    border-radius: 2px;
    width: 4px;
    top: 0px;
    height: -webkit-fill-available;
    position: absolute;
    margin: 15px 0px;
`
