import moment from 'moment'
import React from 'react'
import styled from 'styled-components'
import { UIElement } from '../../../../../main-ui/classes'
import Logic, { AnnotationDetailsState } from './logic'
import { AnnotationDetailsEvent, AnnotationDetailsDependencies } from './types'
import DocumentTitle from '../../../../../main-ui/components/document-title'
import DefaultPageLayout from '../../../../../common-ui/layouts/default-page-layout'
import LoadingIndicator from '../../../../../common-ui/components/loading-indicator'
import ErrorWithAction from '../../../../../common-ui/components/error-with-action'
import Markdown from '../../../../../common-ui/components/markdown'
const logoImage = require('../../../../../assets/img/memex-logo.svg')

export default class AnnotationDetailsPage extends UIElement<
    AnnotationDetailsDependencies,
    AnnotationDetailsState,
    AnnotationDetailsEvent
> {
    constructor(props: AnnotationDetailsDependencies) {
        super(props, { logic: new Logic(props) })
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
                <AnnotationPage>
                    <IntroArea>
                        <LogoLinkArea href={'https://getmemex.com'}>
                            <MemexLogo />
                        </LogoLinkArea>
                        <IntroText>
                            Someone wants to share this note with you
                        </IntroText>
                    </IntroArea>
                    <AnnotationContainer>
                        <AnnotationContentBox>
                            {annotation.body && (
                                <AnnotationBody>
                                    {annotation.body}
                                </AnnotationBody>
                            )}
                            {annotation.comment && (
                                <AnnotationComment>
                                    <Markdown>{annotation.comment}</Markdown>
                                </AnnotationComment>
                            )}
                            <AnnotationAuthorBox>
                                <AnnotationAuthorName>
                                    {state.creatorLoadState === 'success' && (
                                        <div>
                                            {creator && creator.displayName}
                                            {!creator && ''}
                                        </div>
                                    )}
                                </AnnotationAuthorName>
                                <AnnotationAuthorUploadDate>
                                    {moment(annotation.createdWhen).format(
                                        'LLL',
                                    )}
                                </AnnotationAuthorUploadDate>
                            </AnnotationAuthorBox>
                        </AnnotationContentBox>
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
                                                <GoToAnnotationButton
                                                    href={pageInfo.originalUrl}
                                                    target="_blank"
                                                >
                                                    Go to Page
                                                </GoToAnnotationButton>
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

const IntroArea = styled.div`
    display: flex;
    justify-content: center;
    margin: 10px 15px 10px 15px;
    flex-direction: column;
    align-items: center;
    width: 100%;
`
const IntroText = styled.div`
    display: flex;
    justify-content: center;
    text-align: center;
    margin: 15px 0 0 0;
    font-weight: bold;
    line-height: 26px;
    white-space: normal;
    padding: 0 5px;
    box-decoration-break: clone;
    font-size: 16px;
    color: ${(props) => props.theme.colors.primary};
`

const LogoLinkArea = styled.a``

const MemexLogo = styled.div`
    height: 24px;
    background-position: center;
    background-size: contain;
    width: 100px;
    border: none;
    cursor: pointer;
    margin-right: 20px;
    background-repeat: no-repeat;
    background-image: url(${logoImage});
    display: flex;
`

const AnnotationPage = styled.div`
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
`

const AnnotationContainer = styled.div`
    width: 90%;
    max-width: 550px;
    margin-bottom: 25vh;

    background: #ffffff;
    border: 1.72269px solid rgba(0, 0, 0, 0.1);
    box-sizing: border-box;
    box-shadow: 0px 3.72px 27px rgba(0, 0, 0, 0.1);
    border-radius: 8.61345px;
`
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
    color: ${(props) => props.theme.colors.primary};
`
const AnnotationComment = styled.div`
    font-family: ${(props) => props.theme.fonts.primary};
    font-weight: normal;
    line-height: 26px;
    margin-top: 5px;
    white-space: normal;
    padding: 0 5px;
    box-decoration-break: clone;
    font-size: 16px;
    color: ${(props) => props.theme.colors.primary};
`
const AnnotationAuthorBox = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    font-family: ${(props) => props.theme.fonts.primary};
    padding: 0 5px;
    margin-top: 15px;
`
const AnnotationAuthorName = styled.div`
    color: ${(props) => props.theme.colors.primary};
    font-size: 12px;
    font-weight: bold;
    height: 24px;
    padding-right: 10px;
`

const AnnotationAuthorUploadDate = styled.div`
    color: ${(props) => props.theme.colors.primary};
    font-size: 12px;
    font-weight: normal;
`
const AnnotationFooter = styled.div`
    border-top: 1px solid ${(props) => props.theme.colors.lineGrey};
    padding: 15px;
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
`
const AnnotationFooterError = styled.div``

const AnnotationPageTitle = styled.div`
    font-family: ${(props) => props.theme.fonts.primary};
    color: ${(props) => props.theme.colors.black};
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
    color: ${(props) => props.theme.colors.primary};
    width: 355px;
    font-size: 12px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow-wrap: break-word;
    overflow-x: hidden;
    width: 100%;
`

const GoToAnnotationButton = styled.a`
    border-radius: 5px;
    background-color: ${(props) => props.theme.colors.purple};
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
