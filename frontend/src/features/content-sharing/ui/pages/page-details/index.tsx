import moment from 'moment'
import React from 'react'
import styled, { css } from 'styled-components'
import { UIElement } from '../../../../../main-ui/classes'
import Logic from './logic'
import {
    PageDetailsEvent,
    PageDetailsDependencies,
    PageDetailsState,
} from './types'
import DocumentTitle from '../../../../../main-ui/components/document-title'
import DefaultPageLayout from '../../../../../common-ui/layouts/default-page-layout'
import LoadingScreen from '../../../../../common-ui/components/loading-screen'
import { Margin } from 'styled-components-spacing'
import AnnotationsInPage from '../../../../annotations/ui/components/annotations-in-page'
import LoadingIndicator from '../../../../../common-ui/components/loading-indicator'
import ErrorWithAction from '../../../../../common-ui/components/error-with-action'
import ProfilePopupContainer from '../../../../user-management/ui/containers/profile-popup-container'
//import type { Props as ListsSidebarProps } from '../../../../lists-sidebar/ui/components/lists-sidebar'
import InstallExtOverlay from '../../../../ext-detection/ui/components/install-ext-overlay'
import { ViewportBreakpoint } from '../../../../../main-ui/styles/types'
import { getViewportBreakpoint } from '../../../../../main-ui/styles/utils'
import MissingPdfOverlay from '../../../../ext-detection/ui/components/missing-pdf-overlay'

const PageInfoList = styled.div`
    width: 100%;
    padding-bottom: 200px;
`

const AnnotationsLoading = styled.div`
    display: flex;
    justify-content: center;
    height: 300px;
    align-items: center;
`

const SubtitleContainer = styled.div<{
    viewportBreakpoint: ViewportBreakpoint
}>`
    display: flex;
    align-items: center;
    grid-gap: 30px;
    font-size: 14px;

    ${(props) =>
        props.viewportBreakpoint === 'mobile' &&
        css`
            margin-top: -5px;
            grid-gap: 10px;
            flex-direction: column;
            align-items: flex-start;
        `}
`

const DomainName = styled.a`
    color: ${(props) => props.theme.colors.normalText};
    text-decoration: none;
`

const RearBox = styled.div<{
    viewportBreakpoint: ViewportBreakpoint
}>`
    display: inline-block;
    align-items: center;
    grid-gap: 5px;
    color: ${(props) => props.theme.colors.lighterText};

    /* ${(props) =>
        props.viewportBreakpoint === 'mobile' &&
        css`
            grid-gap: 3px;
            flex-direction: column;
            align-items: flex-start;
        `} */
`

const Creator = styled.span`
    color: ${(props) => props.theme.colors.purple};
    padding: 0 4px;
`

const SharedBy = styled.span`
    color: ${(props) => props.theme.colors.lighterText};
    display: inline-block;
`

const Date = styled.span`
    color: ${(props) => props.theme.colors.lighterText};
    display: inline-block;
`

const Title = styled.a`
    font-size: inherit;
    color: inherit;
    cursor: pointer;
    text-decoration: none;
`

export default class PageDetailsPage extends UIElement<
    PageDetailsDependencies,
    PageDetailsState,
    PageDetailsEvent
> {
    constructor(props: PageDetailsDependencies) {
        super(props, { logic: new Logic(props) })
    }

    get viewportBreakpoint(): ViewportBreakpoint {
        return getViewportBreakpoint(this.getViewportWidth())
    }

    // get listsSidebarProps(): Omit<
    //     ListsSidebarProps,
    //     'services' | 'storage' | 'viewportBreakpoint'
    // > {
    //     return {
    //         collaborativeLists: this.state.collaborativeLists,
    //         followedLists: this.state.followedLists,
    //         isShown: this.state.isListSidebarShown,
    //         loadState: this.state.listSidebarLoadState,
    //         onToggle: () => this.processEvent('toggleListSidebar', undefined),
    //     }
    // }

    private renderModals() {
        if (this.state.isInstallExtModalShown) {
            return (
                <InstallExtOverlay
                    services={this.props.services}
                    viewportBreakpoint={this.viewportBreakpoint}
                    onCloseRequested={() =>
                        this.processEvent('toggleInstallExtModal', {})
                    }
                    mode={
                        this.state.clickedPageUrl != null
                            ? 'click-page'
                            : 'add-page'
                    }
                    clickedPageUrl={this.state.clickedPageUrl!}
                />
            )
        }

        if (this.state.isMissingPDFModalShown) {
            return (
                <MissingPdfOverlay
                    services={this.props.services}
                    viewportBreakpoint={this.viewportBreakpoint}
                    onCloseRequested={() =>
                        this.processEvent('toggleMissingPdfModal', {})
                    }
                />
            )
        }

        return null
    }

    render() {
        const { state, props } = this
        const { services, storage } = props
        const { annotations, creator, pageInfo } = state

        if (
            state.pageInfoLoadState === 'pristine' ||
            state.pageInfoLoadState === 'running'
        ) {
            return (
                <DefaultPageLayout
                    services={services}
                    storage={storage}
                    viewportBreakpoint={this.viewportBreakpoint}
                    headerTitle={'Loading page...'}
                    // listsSidebarProps={this.listsSidebarProps}
                >
                    <DocumentTitle
                        documentTitle={services.documentTitle}
                        subTitle="Loading page..."
                    />
                    <LoadingScreen />
                </DefaultPageLayout>
            )
        }
        if (state.pageInfoLoadState === 'error') {
            return (
                <DefaultPageLayout
                    services={services}
                    storage={storage}
                    viewportBreakpoint={this.viewportBreakpoint}
                    headerTitle={'Could not load page'}
                    // listsSidebarProps={this.listsSidebarProps}
                >
                    <DocumentTitle
                        documentTitle={props.services.documentTitle}
                        subTitle="Error loading page  :("
                    />
                    <ErrorWithAction errorType="internal-error">
                        Error loading page contents. <br /> Reload page to
                        retry.
                    </ErrorWithAction>
                </DefaultPageLayout>
            )
        }

        if (!pageInfo) {
            return (
                <DefaultPageLayout
                    services={services}
                    storage={storage}
                    viewportBreakpoint={this.viewportBreakpoint}
                    headerTitle={'Shared page not found'}
                    // listsSidebarProps={this.listsSidebarProps}
                >
                    <DocumentTitle
                        documentTitle={services.documentTitle}
                        subTitle="Shared page not found"
                    />
                    <ErrorWithAction
                        errorType="not-found"
                        action={{
                            label: 'Create your first collection',
                            url: 'https://getmemex.com',
                        }}
                    >
                        Could not find the shared page you were looking for.
                        Maybe somebody shared it, but then removed it again?
                    </ErrorWithAction>
                </DefaultPageLayout>
            )
        }

        return (
            <>
                <DocumentTitle
                    documentTitle={services.documentTitle}
                    subTitle={`Shared page${
                        creator ? ` by ${creator.displayName}` : ''
                    }`}
                />
                {this.renderModals()}
                <DefaultPageLayout
                    services={services}
                    storage={storage}
                    viewportBreakpoint={this.viewportBreakpoint}
                    headerTitle={this.getHeaderTitle()}
                    //headerSubtitle={this.state.pageInfo?.normalizedUrl}
                    // listsSidebarProps={this.listsSidebarProps}
                    headerSubtitle={this.getHeaderSubtitle()}
                    renderSubtitle={(props) => (
                        <ProfilePopupContainer
                            services={services}
                            storage={storage}
                            userRef={this.state.creatorReference ?? null}
                        >
                            {props.children}
                        </ProfilePopupContainer>
                    )}
                >
                    <PageInfoList>
                        {/* <Margin>
                            <PageInfoBox
                                onClick={(e) =>
                                    this.processEvent('clickPageResult', {
                                        urlToOpen: pageInfo.originalUrl,
                                        preventOpening: () =>
                                            e.preventDefault(),
                                    })
                                }
                                type={
                                    isPagePdf({ url: pageInfo.normalizedUrl })
                                        ? 'pdf'
                                        : 'page'
                                }
                                pageInfo={pageInfo}
                                creator={creator}
                                profilePopup={
                                    state.creatorReference && {
                                        services: services,
                                        storage: storage,
                                        userRef: state.creatorReference,
                                    }
                                }
                            />
                        </Margin> */}
                        <Margin bottom="large">
                            {(state.annotationLoadState === 'pristine' ||
                                state.annotationLoadState === 'running') && (
                                <Margin vertical="medium">
                                    <AnnotationsLoading>
                                        <LoadingIndicator size={20} />
                                    </AnnotationsLoading>
                                </Margin>
                            )}
                            {/* Modify the next line to show something if the page doesn't have any annotations */}
                            {state.annotationLoadState === 'success' &&
                                !annotations?.length &&
                                ' '}
                            {state.annotationLoadState === 'success' &&
                                !!annotations?.length && (
                                    <AnnotationsInPage
                                        loadState={state.annotationLoadState}
                                        annotations={annotations}
                                        // newPageReply={
                                        //     state.newPageReplies[
                                        //         normalizedPageUrl
                                        //     ]
                                        // }
                                        getAnnotationCreator={() =>
                                            state.creator
                                        }
                                        getAnnotationCreatorRef={() =>
                                            state.creatorReference
                                        }
                                        profilePopupProps={{
                                            services: this.props.services,
                                            storage: this.props.storage,
                                        }}
                                        annotationConversations={
                                            state.conversations
                                        }
                                        newPageReplyEventHandlers={{}}
                                    />
                                )}
                        </Margin>
                    </PageInfoList>
                </DefaultPageLayout>
            </>
        )
    }

    getHeaderTitle(): JSX.Element | string {
        const { pageInfoLoadState, pageInfo } = this.state
        if (pageInfoLoadState === 'success') {
            if (!pageInfo) {
                return 'Page not found'
            } else {
                return (
                    <Title href={pageInfo.originalUrl} target="_blank">
                        {pageInfo.fullTitle}
                    </Title>
                )
            }
        }
        if (
            pageInfoLoadState === 'pristine' ||
            pageInfoLoadState === 'running'
        ) {
            return <LoadingIndicator size={20} />
        }
        return 'Error'
    }

    getHeaderSubtitle(): JSX.Element | undefined {
        const { creator, pageInfo } = this.state
        // return creator ? `${creator.displayName}` : undefined

        return (
            <>
                <SubtitleContainer viewportBreakpoint={this.viewportBreakpoint}>
                    <DomainName href={pageInfo?.originalUrl} target="_blank">
                        {pageInfo?.normalizedUrl.split('/')[0]}
                    </DomainName>
                    <RearBox viewportBreakpoint={this.viewportBreakpoint}>
                        shared{' '}
                        {creator?.displayName && (
                            <SharedBy>
                                by
                                <Creator>
                                    {creator?.displayName || undefined}
                                </Creator>
                            </SharedBy>
                        )}
                        <Date>
                            <span>
                                on {moment(pageInfo?.createdWhen).format('LLL')}
                            </span>
                        </Date>
                        {/* <Margin horizontal="smallest">
                        ·
                    </Margin>
                    <Date>
                        on {moment(pageInfo?.createdWhen).format('LLL')}`
                    </Date> */}
                    </RearBox>
                </SubtitleContainer>
            </>
        )
    }
}
