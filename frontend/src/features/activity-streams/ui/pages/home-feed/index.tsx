import React from 'react'
import styled, { css } from 'styled-components'
import { UIElement } from '../../../../../main-ui/classes'
import Logic from './logic'
import {
    HomeFeedEvent,
    HomeFeedDependencies,
    HomeFeedState,
    ActivityItem,
    PageActivityItem,
    ListActivityItem,
    AnnotationActivityItem,
} from './types'
import DocumentTitle from '../../../../../main-ui/components/document-title'
import DefaultPageLayout from '../../../../../common-ui/layouts/default-page-layout'
import { Margin } from 'styled-components-spacing'
import MessageBox from '../../../../../common-ui/components/message-box'
import RouteLink from '../../../../../common-ui/components/route-link'
import ErrorBox from '../../../../../common-ui/components/error-box'
import InstallExtOverlay from '../../../../ext-detection/ui/components/install-ext-overlay'
import { getViewportBreakpoint } from '../../../../../main-ui/styles/utils'
import { ViewportBreakpoint } from '../../../../../main-ui/styles/types'
import MissingPdfOverlay from '../../../../ext-detection/ui/components/missing-pdf-overlay'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import IconBox from '@worldbrain/memex-common/lib/common-ui/components/icon-box'
import { IconKeys } from '@worldbrain/memex-common/lib/common-ui/styles/types'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import { Waypoint } from 'react-waypoint'
import { mapOrderedMap } from '../../../../../utils/ordered-map'
import { act } from 'react-dom/test-utils'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import Markdown from '@worldbrain/memex-common/lib/common-ui/components/markdown'

const StyledIconMargin = styled(Margin)`
    display: flex;
`

const LoadMoreLink = styled(RouteLink)`
    display: flex;
    justify-content: center;
    font-family: ${(props) => props.theme.fonts.primary};
    color: ${(props) => props.theme.colors.prime1};
    font-size: 11px;
    cursor: pointer;
    border-radius: 3px;
    align-items: center;
    &:hover {
        background: ${(props) => props.theme.colors.greyScale2};
    }
`

const FeedContainer = styled.div<{
    viewportBreakpoint: ViewportBreakpoint
    isIframe: boolean
}>`
    margin-top: 20px;
    padding-bottom: 200px;

    ${(props) =>
        (props.viewportBreakpoint === 'small' ||
            props.viewportBreakpoint === 'mobile') &&
        css`
            padding: 0 10px 200px 10px;
        `}

    ${(props) =>
        props.isIframe &&
        css`
            padding: 0 0px 100px 0px;
        `}
`

const ActivityType = styled.div`
    white-space: nowrap;
    color: ${(props) => props.theme.colors.white};
`

const CollectionLink = styled(RouteLink)`
    display: block;
    justify-content: center;
    font-family: ${(props) => props.theme.fonts.primary};
    color: ${(props) => props.theme.colors.prime1};
    padding-left: 5px;
    cursor: pointer;
    align-items: center;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-weight: bold;
    justify-content: flex-start;
    width: 100%;
    overflow: hidden;
    &:hover {
        text-decoration: underline;
    }
`

const StyledActivityReason = styled.div`
    display: flex;
    align-items: center;
    width: 95%;
    margin-bottom: 15px;
`

const LoadingIndicatorBox = styled.div<{ height?: string }>`
    display: flex;
    justify-content: center;
    align-items: center;
    height: ${(props) => (props.height ? props.height : '60px')};
`

const ActivityReasonLabel = styled.div<{
    viewportBreakpoint?: ViewportBreakpoint
}>`
    font-family: ${(props) => props.theme.fonts.primary};
    font-weight: normal;
    font-size: 16px;
    color: ${(props) => props.theme.colors.white};
    display: flex;
    width: 92%;
    overflow: hidden;
    text-overflow: ellipsis;
`

const AnnotationEntriesLoadingContainer = styled.div`
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
`

const LastSeenLineContainer = styled.div<{ shouldShowNewLine: boolean }>`
    margin: ${(props) =>
        !props.shouldShowNewLine ? '0px 0 0px 0' : '100px 0 0px 0'};
`

const StyledLastSeenLine = styled.div`
    display: flex;
    position: relative;
    width: 100%;
    justify-content: flex-start;
    font-size: 16px;
    align-items: center;
    color: ${(props) => props.theme.colors.greyScale2};
    font-weight: 800;
    margin-bottom: 20px;
`
const LastSeenLineLabel = styled.div`
    font-family: ${(props) => props.theme.fonts.primary};
    text-align: center;
    padding: 5px 15px 5px 10px;
    color: ${(props) => props.theme.colors.white};
    z-index: 2;
    display: flex;
    align-items: center;
    grid-gap: 10px;
    border-radius: 8px;
    border: 1px solid ${(props) => props.theme.colors.greyScale3};
`

const LoadMoreReplies = styled.div`
    display: flex;
    justify-content: center;
    font-family: ${(props) => props.theme.fonts.primary};
    font-size: 11px;
    cursor: pointer;
    border-radius: 3px;
    height: 20px;
    grid-gap: 5px;
    align-items: center;
    color: ${(props) => props.theme.colors.white};
`

const Separator = styled.div`
    height: 1px;
    display: flex;
    width: fill-available;
    background: ${(props) => props.theme.colors.greyScale3};
`

const NoActivitiesContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`

const HeaderSubTitle = styled.div`
    display: flex;
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 16px;
    font-weight: 300;
    margin-bottom: 15px;
`

type ActivityItemRendererOpts = { groupAlreadySeen: boolean }
type ActivityItemRendererResult = React.ReactNode
type ActivityItemRenderer<T extends ActivityItem> = (
    item: T,
    options: ActivityItemRendererOpts,
) => ActivityItemRendererResult

export default class HomeFeedPage extends UIElement<
    HomeFeedDependencies,
    HomeFeedState,
    HomeFeedEvent
> {
    static defaultProps: Partial<HomeFeedDependencies> = {
        listActivitiesLimit: 6,
    }

    constructor(props: HomeFeedDependencies) {
        super(props, { logic: new Logic(props) })
    }

    get viewportBreakpoint(): ViewportBreakpoint {
        return getViewportBreakpoint(this.getViewportWidth())
    }

    isIframe = () => {
        try {
            return window.self !== window.top
        } catch (e) {
            return true
        }
    }

    renderContent() {
        const { state } = this
        if (state.loadState === 'pristine' || state.loadState === 'running') {
            return (
                <LoadingIndicatorBox height={'180px'}>
                    <LoadingIndicator />
                </LoadingIndicatorBox>
            )
        }
        if (state.loadState === 'error') {
            return 'Error'
        }
        if (!this.state.activityItems.length) {
            return this.renderNoActivities()
        }
        // this.shouldRenderNewLine()
        return (
            <FeedContainer
                isIframe={this.isIframe()}
                viewportBreakpoint={this.viewportBreakpoint}
            >
                {this.state.shouldShowNewLine && (
                    <div id="1">{this.renderNewLine()}</div>
                )}
                {this.renderActivities(this.state.activityItems)}
                <Waypoint
                    onEnter={() => this.processEvent('waypointHit', null)}
                />
            </FeedContainer>
        )
    }

    renderNewLine() {
        return (
            <StyledLastSeenLine>
                <LastSeenLineLabel>
                    <Icon
                        icon="stars"
                        color="prime1"
                        heightAndWidth="22px"
                        hoverOff
                    />
                    New
                </LastSeenLineLabel>
                <Separator />
            </StyledLastSeenLine>
        )
    }

    renderNoActivities() {
        return (
            <Margin vertical="largest">
                <NoActivitiesContainer>
                    <Margin bottom={'small'}>
                        <IconBox heightAndWidth="50px">
                            <Icon
                                icon={'newFeed'}
                                heightAndWidth="25px"
                                color="prime1"
                                hoverOff
                            />
                        </IconBox>
                    </Margin>
                    <MessageBox title="No Updates (yet)">
                        Follow, reply or collaboratively curate Spaces to see
                        updates here.
                    </MessageBox>
                </NoActivitiesContainer>
            </Margin>
        )
    }

    renderActivities(activities: HomeFeedState['activityItems']) {
        const lastSeenLine = new LastSeenLineState(
            this.state.lastSeenTimestamp ?? null,
        )
        return activities.map((item) => {
            const shouldRenderLastSeenLine = lastSeenLine.shouldRenderBeforeItem(
                item,
            )
            let result: ActivityItemRendererResult
            if (item.type === 'page-item') {
                result = this.renderPageItem(item, {
                    groupAlreadySeen: lastSeenLine.alreadyRenderedLine,
                })
            } else if (item.type === 'list-item') {
                result = this.renderListItem(item, {
                    groupAlreadySeen: lastSeenLine.alreadyRenderedLine,
                })
            } else if (item.type === 'annotation-item') {
                result = this.renderAnnotationItem(item, {
                    groupAlreadySeen: lastSeenLine.alreadyRenderedLine,
                })
            } else {
                throw new Error(
                    `Received unsupported activity type to render: ${
                        (item as ActivityItem).type
                    }`,
                )
            }
            return (
                <React.Fragment key={item.groupId}>
                    {shouldRenderLastSeenLine && (
                        <LastSeenLineContainer
                            shouldShowNewLine={this.state.shouldShowNewLine}
                            id="lastSeenLine"
                        >
                            <LastSeenLine />
                        </LastSeenLineContainer>
                    )}
                    {result}
                </React.Fragment>
            )
        })
    }

    renderActivityReason(activityItem: ActivityItem) {
        if (activityItem.reason === 'new-replies') {
            return (
                <ActivityReason
                    icon={'threadIcon'}
                    label="New replies in one of your threads"
                />
            )
        }

        if (activityItem.reason === 'pages-added-to-list') {
            return (
                <ActivityReason
                    icon={'heartEmpty'}
                    label={
                        <>
                            <ActivityType>Pages added to</ActivityType>
                            <CollectionLink
                                route="collectionDetails"
                                services={this.props.services}
                                params={{
                                    id: activityItem.list.reference
                                        .id as string,
                                }}
                            >
                                {activityItem.list.title}
                            </CollectionLink>
                        </>
                    }
                    viewportBreakpoint={this.viewportBreakpoint}
                />
            )
        }

        if (activityItem.reason === 'new-annotations' && activityItem.list) {
            return (
                <ActivityReason
                    icon={'commentAdd'}
                    label={
                        <>
                            <ActivityType>
                                New annotations in {activityItem.list && 'to'}{' '}
                            </ActivityType>
                            <CollectionLink
                                route="collectionDetails"
                                services={this.props.services}
                                params={{
                                    id: activityItem.list.reference
                                        .id as string,
                                }}
                            >
                                {activityItem.list?.title}
                            </CollectionLink>
                        </>
                    }
                    viewportBreakpoint={this.viewportBreakpoint}
                />
            )
        }

        return null
    }

    renderPageItem: ActivityItemRenderer<PageActivityItem> = (
        activityItem,
        options,
    ) => {
        if (activityItem.reason !== 'new-annotations') {
            return null
        }

        return (
            <UpdateItemContainer>
                <UpdateItemTopBar>
                    <UpdateItemTitleArea>
                        <Icon
                            filePath="reply"
                            heightAndWidth={'22px'}
                            hoverOff
                            color={'prime1'}
                        />

                        <UpdateItemTitle
                            viewportBreakpoint={this.viewportBreakpoint}
                        >
                            <UpdateItemTitleContainer>
                                <UpdateCounter>
                                    {activityItem.activities.length}{' '}
                                </UpdateCounter>
                                new annotation for page{' '}
                                {pluralize(
                                    activityItem.activities.length,
                                    'annotation',
                                )}{' '}
                                in{' '}
                            </UpdateItemTitleContainer>
                            {activityItem.list && (
                                <SpaceTitleContainer>
                                    {' '}
                                    <SpaceTitle>
                                        {' '}
                                        <RouteLink
                                            services={this.props.services}
                                            route="collectionDetails"
                                            params={{
                                                id: activityItem.list.reference.id.toString(),
                                                entryId: activityItem.list.entry.id.toString(),
                                            }}
                                            query={getRangeQueryParams(
                                                'AnnotEntry',
                                                activityItem,
                                            )}
                                            target={
                                                this.isIframe()
                                                    ? '_blank'
                                                    : undefined
                                            }
                                        >
                                            {activityItem.list?.title}
                                        </RouteLink>
                                    </SpaceTitle>
                                </SpaceTitleContainer>
                            )}
                        </UpdateItemTitle>
                    </UpdateItemTitleArea>
                    {activityItem.list && (
                        <RouteLink
                            services={this.props.services}
                            route="collectionDetails"
                            params={{
                                id: activityItem.list.reference.id.toString(),
                                entryId: activityItem.list.entry.id.toString(),
                            }}
                            query={getRangeQueryParams(
                                'AnnotEntry',
                                activityItem,
                            )}
                            target={this.isIframe() ? '_blank' : undefined}
                        >
                            <PrimaryAction
                                label="View"
                                onClick={null}
                                icon="arrowRight"
                                iconPosition="right"
                                type="primary"
                                size="medium"
                            />
                        </RouteLink>
                    )}
                </UpdateItemTopBar>
                <UpdateItemReferencedContentContainer>
                    <PageBox>
                        <PageTitle>{activityItem.pageTitle}</PageTitle>
                        <PageDomain>
                            {activityItem.normalizedPageUrl.split('/')[0]}
                        </PageDomain>
                    </PageBox>
                </UpdateItemReferencedContentContainer>
            </UpdateItemContainer>
        )
    }

    renderAnnotationItem: ActivityItemRenderer<AnnotationActivityItem> = (
        activityItem,
        options,
    ) => {
        if (activityItem.reason !== 'new-replies') {
            return null
        }

        return (
            <UpdateItemContainer>
                <UpdateItemTopBar>
                    <UpdateItemTitleArea>
                        <Icon
                            filePath="reply"
                            heightAndWidth={'22px'}
                            hoverOff
                            color={'prime1'}
                        />

                        <UpdateItemTitle
                            viewportBreakpoint={this.viewportBreakpoint}
                        >
                            <UpdateItemTitleContainer>
                                <UpdateCounter>
                                    {activityItem.activities.length}{' '}
                                </UpdateCounter>
                                {pluralize(
                                    activityItem.activities.length,
                                    'reply',
                                    'replies',
                                )}{' '}
                                for annotation in{' '}
                            </UpdateItemTitleContainer>
                            {activityItem.list && (
                                <SpaceTitleContainer>
                                    {' '}
                                    <SpaceTitle>
                                        {' '}
                                        <RouteLink
                                            services={this.props.services}
                                            route="collectionDetails"
                                            params={{
                                                id: activityItem.list.reference.id.toString(),
                                                entryId: activityItem.list.entry.id.toString(),
                                            }}
                                            query={{
                                                annotationId: activityItem.annotation.reference.id.toString(),
                                                ...getRangeQueryParams(
                                                    'Reply',
                                                    activityItem,
                                                ),
                                            }}
                                            target={
                                                this.isIframe()
                                                    ? '_blank'
                                                    : undefined
                                            }
                                        >
                                            {activityItem.list?.title}
                                        </RouteLink>
                                    </SpaceTitle>
                                </SpaceTitleContainer>
                            )}
                        </UpdateItemTitle>
                    </UpdateItemTitleArea>
                    {activityItem.list && (
                        <RouteLink
                            services={this.props.services}
                            route="collectionDetails"
                            params={{
                                id: activityItem.list.reference.id.toString(),
                                entryId: activityItem.list.entry.id.toString(),
                            }}
                            query={getRangeQueryParams(
                                'ListEntry',
                                activityItem,
                            )}
                            target={this.isIframe() ? '_blank' : undefined}
                        >
                            <PrimaryAction
                                label="View"
                                onClick={null}
                                icon="arrowRight"
                                iconPosition="right"
                                type="primary"
                                size="medium"
                            />
                        </RouteLink>
                    )}
                </UpdateItemTopBar>
                <UpdateItemReferencedContentContainer>
                    <AnnotationBox>
                        {activityItem.annotation.body && (
                            <HighlightBox>
                                <HighlightVerticalBar></HighlightVerticalBar>
                                <Highlight>
                                    <Markdown>
                                        {activityItem.annotation.body}
                                    </Markdown>
                                </Highlight>
                            </HighlightBox>
                        )}
                        {activityItem.annotation.comment && (
                            <Comment>
                                <Markdown>
                                    {activityItem.annotation.comment}
                                </Markdown>
                            </Comment>
                        )}
                    </AnnotationBox>
                    <PageBox>
                        <PageTitle>{activityItem.pageTitle}</PageTitle>
                        <PageDomain>
                            {activityItem.normalizedPageUrl.split('/')[0]}
                        </PageDomain>
                    </PageBox>
                </UpdateItemReferencedContentContainer>
            </UpdateItemContainer>
        )
    }

    isSeen(timestamp: number) {
        const { lastSeenTimestamp } = this.state
        return !!lastSeenTimestamp && lastSeenTimestamp > timestamp
    }

    renderListItem: ActivityItemRenderer<ListActivityItem> = (
        listItem,
        options,
    ) => {
        if (listItem.reason !== 'pages-added-to-list') {
            return null
        }
        return (
            <UpdateItemContainer>
                <UpdateItemTopBar>
                    <UpdateItemTitleArea>
                        <Icon
                            filePath="heartEmpty"
                            heightAndWidth={'22px'}
                            hoverOff
                            color={'prime1'}
                        />

                        <UpdateItemTitle
                            viewportBreakpoint={this.viewportBreakpoint}
                        >
                            <UpdateItemTitleContainer>
                                <UpdateCounter>
                                    {listItem.activities.length}{' '}
                                </UpdateCounter>
                                {pluralize(listItem.activities.length, 'page')}{' '}
                                added in{' '}
                            </UpdateItemTitleContainer>
                            <SpaceTitleContainer>
                                {' '}
                                <SpaceTitle>
                                    {' '}
                                    <RouteLink
                                        services={this.props.services}
                                        route="collectionDetails"
                                        params={{
                                            id: listItem.list.reference.id.toString(),
                                        }}
                                        query={getRangeQueryParams(
                                            'ListEntry',
                                            listItem,
                                        )}
                                        target={
                                            this.isIframe()
                                                ? '_blank'
                                                : undefined
                                        }
                                    >
                                        {listItem.list.title}
                                    </RouteLink>
                                </SpaceTitle>
                            </SpaceTitleContainer>
                        </UpdateItemTitle>
                    </UpdateItemTitleArea>
                    <RouteLink
                        services={this.props.services}
                        route="collectionDetails"
                        params={{ id: listItem.list.reference.id.toString() }}
                        query={getRangeQueryParams('ListEntry', listItem)}
                        target={this.isIframe() ? '_blank' : undefined}
                    >
                        <PrimaryAction
                            label="View"
                            onClick={null}
                            icon="arrowRight"
                            iconPosition="right"
                            type="primary"
                            size="medium"
                        />
                    </RouteLink>
                </UpdateItemTopBar>
            </UpdateItemContainer>
        )
    }

    renderNeedsAuth() {
        return (
            <>
                <DocumentTitle
                    documentTitle={this.props.services.documentTitle}
                    subTitle={`Collaboration Feed`}
                />
                <DefaultPageLayout
                    services={this.props.services}
                    storage={this.props.storage}
                    viewportBreakpoint={this.viewportBreakpoint}
                    hideActivityIndicator
                >
                    <ErrorBox>You need to login to view your feed.</ErrorBox>
                </DefaultPageLayout>
            </>
        )
    }

    renderHeaderSubTitle() {
        return (
            <HeaderSubTitle>
                Updates from Spaces you follow or conversation you participate
                in
            </HeaderSubTitle>
        )
    }

    private renderModals() {
        // if (this.state.isInstallExtModalShown) {
        //     return (
        //         <InstallExtOverlay
        //             services={this.props.services}
        //             viewportBreakpoint={this.viewportBreakpoint}
        //             onCloseRequested={() =>
        //                 this.processEvent('toggleInstallExtModal', {})
        //             }
        //             mode={
        //                 this.state.clickedPageUrl != null
        //                     ? 'click-page'
        //                     : 'add-page'
        //             }
        //             intent={'openLink'}
        //             clickedPageUrl={this.state.clickedPageUrl!}
        //         />
        //     )
        // }

        // if (this.state.isMissingPDFModalShown) {
        //     return (
        //         <MissingPdfOverlay
        //             services={this.props.services}
        //             viewportBreakpoint={this.viewportBreakpoint}
        //             onCloseRequested={() =>
        //                 this.processEvent('toggleMissingPdfModal', {})
        //             }
        //         />
        //     )
        // }

        return null
    }

    render() {
        if (this.state.needsAuth) {
            return this.renderNeedsAuth()
        }

        return (
            <>
                <DocumentTitle
                    documentTitle={this.props.services.documentTitle}
                    subTitle={`Collaboration Feed`}
                />
                {this.renderModals()}
                <DefaultPageLayout
                    services={this.props.services}
                    storage={this.props.storage}
                    viewportBreakpoint={this.viewportBreakpoint}
                    hideActivityIndicator
                    headerTitle="Activity Feed"
                    headerSubtitle={this.renderHeaderSubTitle()}
                    context="feed"
                    // listsSidebarProps={{
                    //     collaborativeLists: this.state.collaborativeLists,
                    //     followedLists: this.state.followedLists,
                    //     isShown: this.state.isListSidebarShown,
                    //     loadState: this.state.listSidebarLoadState,
                    //     onToggle: () =>
                    //         this.processEvent('toggleListSidebar', undefined),
                    // }}
                >
                    {this.renderContent()}
                </DefaultPageLayout>
            </>
        )
    }
}

const ActivityReason = (props: {
    icon: IconKeys
    label: React.ReactChild
    viewportBreakpoint?: ViewportBreakpoint
}) => {
    return (
        <StyledActivityReason>
            <StyledIconMargin right="small">
                <Icon icon={props.icon} heightAndWidth="22px" color="prime1" />
            </StyledIconMargin>
            <ActivityReasonLabel viewportBreakpoint={props.viewportBreakpoint}>
                {props.label}
            </ActivityReasonLabel>
        </StyledActivityReason>
    )
}

class LastSeenLineState {
    alreadyRenderedLine = false
    constructor(private lastSeenTimestamp: number | null) {}

    shouldRenderBeforeItem(activityItem: Pick<ActivityItem, 'notifiedWhen'>) {
        if (!this.lastSeenTimestamp) {
            return false
        }
        if (this.alreadyRenderedLine) {
            return false
        }

        const shouldRenderLine =
            activityItem.notifiedWhen < this.lastSeenTimestamp
        if (shouldRenderLine) {
            this.alreadyRenderedLine = true
        }

        return this.alreadyRenderedLine
    }
}

function LastSeenLine() {
    return (
        <StyledLastSeenLine>
            <LastSeenLineLabel>
                <Icon icon="clock" heightAndWidth="22px" hoverOff />
                Seen
            </LastSeenLineLabel>
            <Separator />
        </StyledLastSeenLine>
    )
}

function pluralize(count: number, singular: string, plural?: string) {
    if (count === 1) {
        return singular
    }
    return plural ?? `${singular}s`
}

function getRangeQueryParams(
    type: 'ListEntry' | 'AnnotEntry' | 'Reply',
    activityItem: ActivityItem,
) {
    const lastActivitiy =
        activityItem.activities[activityItem.activities.length - 1]
    return {
        [`from${type}`]: activityItem.activities[0].notifiedWhen.toString(),
        [`to${type}`]: lastActivitiy.notifiedWhen.toString(),
    }
}

const UpdateItemReferencedContentContainer = styled.div`
    display: flex;
    flex-direction: column;
    border-radius: 10px;
    border: 1px solid ${(props) => props.theme.colors.greyScale2};
    margin-top: 15px;
    align-items: flex-start;
`

const AnnotationBox = styled.div`
    display: flex;
    padding: 20px;
    flex-direction: column;
    align-items: center;
    grid-gap: 15px;
    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale2};
    width: -webkit-fill-available;
    justify-content: flex-start;
`

const HighlightBox = styled.div`
    justify-content: flex-start;
    display: flex;
    grid-gap: 10px;
    width: fill-available;
`

const Highlight = styled.div`
    flex: 1;
    color: ${(props) => props.theme.colors.white};
    font-size: 14px;
    justify-content: flex-start;
    text-align: left;
    float: left;
    align-items: center;
`

const HighlightVerticalBar = styled.div`
    width: 6px;
    height: auto;
    background: ${(props) => props.theme.colors.prime1};
    border-radius: 10px;
`

const Comment = styled.div`
    color: ${(props) => props.theme.colors.white};
    font-size: 14px;
    text-align: left;
    float: left;
    display: flex;
    justify-content: flex-start;
    width: fill-available;
`

const PageBox = styled.div`
    display: flex;
    padding: 15px 20px;
    flex-direction: column;
    grid-gap: 2px;
`

const PageTitle = styled.div`
    display: flex;
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 14px;
`

const PageDomain = styled.div`
    display: flex;
    color: ${(props) => props.theme.colors.greyScale4};
    font-size: 14px;
`

const UpdateItemContainer = styled.div`
    display: flex;
    flex-direction: column;
    padding: 20px;
    width: fill-available;
    background: ${(props) => props.theme.colors.greyScale1};
    border-radius: 10px;
    margin-bottom: 10px;

    font-family: ${(props) => props.theme.fonts.primary};

    & * {
        font-family: ${(props) => props.theme.fonts.primary};
    }
`

const UpdateItemTopBar = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: fill-available;
    grid-gap: 20px;
`

const UpdateItemTitleArea = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 10px;
    width: fill-available;
`

const UpdateCounter = styled.span`
    display: flex;
    align-items: center;
    border-radius: 30px;
    align-items: center;
    color: ${(props) => props.theme.colors.white};
    justify-content: center;
    padding: 2px 0px;
    font-weight: 500;
    font-size: 14px;
`

const UpdateItemTitle = styled.div<{
    viewportBreakpoint: ViewportBreakpoint
}>`
    display: flex;
    align-items: center;
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 14px;
    flex-direction: row;
    grid-gap: 6px;
    white-space: nowrap;
    flex: 1;
    flex-direction: column;
    align-items: flex-start;
`

const UpdateItemTitleContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    grid-gap: 5px;
`

const SpaceTitle = styled.span`
    color: ${(props) => props.theme.colors.white};
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`
const SpaceTitleContainer = styled.div`
    display: contents;
    color: ${(props) => props.theme.colors.white};
    font-weight: 500;
    flex: 1;
    overflow: hidden;
`
