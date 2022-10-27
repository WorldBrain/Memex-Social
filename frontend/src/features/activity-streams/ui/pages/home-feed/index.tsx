import pick from 'lodash/pick'
import React from 'react'
import { Waypoint } from 'react-waypoint'
import styled, { css } from 'styled-components'
import { UIElement } from '../../../../../main-ui/classes'
import Logic, { getConversationKey } from './logic'
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
import LoadingScreen from '../../../../../common-ui/components/loading-screen'
import { Margin } from 'styled-components-spacing'
import PageInfoBox, {
    PageInfoBoxAction,
} from '../../../../../common-ui/components/page-info-box'
import AnnotationsInPage from '../../../../annotations/ui/components/annotations-in-page'
import { SharedAnnotationInPage } from '../../../../annotations/ui/components/types'
import MessageBox from '../../../../../common-ui/components/message-box'
import LoadingIndicator from '../../../../../common-ui/components/loading-indicator'
import RouteLink from '../../../../../common-ui/components/route-link'
import {
    mapOrderedMap,
    getOrderedMapIndex,
    OrderedMap,
    filterOrderedMap,
} from '../../../../../utils/ordered-map'
import { SharedAnnotationReference } from '@worldbrain/memex-common/lib/content-sharing/types'
import AnnotationReply from '../../../../content-conversations/ui/components/annotation-reply'
import ErrorBox from '../../../../../common-ui/components/error-box'
import { isPagePdf } from '@worldbrain/memex-common/lib/page-indexing/utils'
import InstallExtOverlay from '../../../../ext-detection/ui/components/install-ext-overlay'
import { getViewportBreakpoint } from '../../../../../main-ui/styles/utils'
import { ViewportBreakpoint } from '../../../../../main-ui/styles/types'
import MissingPdfOverlay from '../../../../ext-detection/ui/components/missing-pdf-overlay'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { IconKeys } from '@worldbrain/memex-common/lib/common-ui/styles/types'

const commentImage = require('../../../../../assets/img/comment.svg')

const StyledIconMargin = styled(Margin)`
    display: flex;
`

const LoadMoreLink = styled(RouteLink)`
    display: flex;
    justify-content: center;
    font-family: ${(props) => props.theme.fonts.primary};
    color: ${(props) => props.theme.colors.primary};
    font-size: 11px;
    cursor: pointer;
    border-radius: 3px;
    align-items: center;
    &:hover {
        background: ${(props) => props.theme.colors.grey};
    }
`

const FeedContainer = styled.div<{ viewportBreakpoint: ViewportBreakpoint }>`
    margin-top: 20px;
    padding-bottom: 200px;

    ${(props) =>
        props.viewportBreakpoint === 'small' &&
        css`
            padding: 0 10px 200px 10px;
        `}
`

const CommentIconBox = styled.div`
    background: #ffffff09;
    border-radius: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 24px;
    width: fit-content;
    padding: 0 10px;
    grid-gap: 6px;
    cursor: pointer;

    & * {
        cursor: pointer;
    }
`

const Counter = styled.div`
    color: ${(props) => props.theme.colors.purple};
    font-size: 14px;
`

const ActivityType = styled.div`
    white-space: nowrap;
    color: ${(props) => props.theme.colors.normalText};
`

const CollectionLink = styled(RouteLink)`
    display: block;
    justify-content: center;
    font-family: ${(props) => props.theme.fonts.primary};
    color: ${(props) => props.theme.colors.purple};
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

const LoadingIndicatorBox = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 60px;
`

const ActivityReasonLabel = styled.div<{
    viewportBreakpoint?: ViewportBreakpoint
}>`
    font-family: ${(props) => props.theme.fonts.primary};
    font-weight: normal;
    font-size: 14px;
    color: ${(props) => props.theme.colors.normalText};
    display: flex;
    width: 92%;
    ${(props) =>
        props.viewportBreakpoint === 'mobile' &&
        css`
            display: flex;
            flex-direction: column;
            grid-gap: 3px;

            & > a {
                padding-left: 0px;
            }
        `}
`

const AnnotationEntriesLoadingContainer = styled.div`
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
`

const LastSeenLineContainer = styled.div<{ shouldShowNewLine: boolean }>`
    margin: ${(props) =>
        !props.shouldShowNewLine ? '20px 0 0px 0' : '100px 0 0px 0'};
`

const StyledLastSeenLine = styled.div`
    display: flex;
    position: relative;
    width: 100%;
    justify-content: flex-start;
    font-size: 16px;
    align-items: center;
    color: ${(props) => props.theme.colors.darkerText};
    font-weight: 800;
    margin-bottom: -20px;
`
const LastSeenLineLabel = styled.div`
    font-family: ${(props) => props.theme.fonts.primary};
    text-align: center;
    padding: 0 20px;
    background: ${(props) => props.theme.darkModeColors.background};
    color: ${(props) => props.theme.darkModeColors.lighterText};
    z-index: 2;
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
    color: ${(props) => props.theme.colors.normalText};
    &:hover {
        background: ${(props) => props.theme.colors.backgroundHighlight};
    }
`

const SectionCircle = styled.div<{ size: string }>`
    //background: ${(props) => props.theme.colors.backgroundHighlight};
    border-radius: 100px;
    height: ${(props) => (props.size ? props.size : '60px')};
    width: ${(props) => (props.size ? props.size : '60px')};
    display: flex;
    justify-content: center;
    align-items: center;
`

const Separator = styled.div`
    height: 1px;
    display: flex;
    width: fill-available;
    background: ${(props) => props.theme.colors.lighterText}70;
`

const NoActivitiesContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`

type ActivityItemRendererOpts = { groupAlreadySeen: boolean }
type ActivityItemRendererResult = {
    key: string | number
    rendered: JSX.Element
}
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

    private getRenderableAnnotation = (
        reference: SharedAnnotationReference,
        hasReplies: boolean,
    ): SharedAnnotationInPage | null => {
        const annotation = this.state.annotations[reference.id]

        if (!annotation) {
            return null
        }

        return {
            linkId: reference.id as string,
            reference: reference,
            hasThread: hasReplies,
            createdWhen: annotation.updatedWhen,
            ...pick(annotation, 'comment', 'body'),
        } as SharedAnnotationInPage
    }

    renderContent() {
        const { state } = this
        if (state.loadState === 'pristine' || state.loadState === 'running') {
            return <LoadingScreen />
        }
        if (state.loadState === 'error') {
            return 'Error'
        }
        if (!this.state.activityItems.order.length) {
            return this.renderNoActivities()
        }

        this.shouldRenderNewLine()

        return (
            <FeedContainer viewportBreakpoint={this.viewportBreakpoint}>
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
                <Icon icon="newFeed" heightAndWidth="20px" hoverOff />
                <LastSeenLineLabel>New</LastSeenLineLabel>
                <Separator />
            </StyledLastSeenLine>
        )
    }

    shouldRenderNewLine() {
        return this.processEvent('getLastSeenLinePosition', null)
    }

    renderNoActivities() {
        return (
            <Margin vertical="largest">
                <NoActivitiesContainer>
                    <Margin bottom={'small'}>
                        <SectionCircle size="50px">
                            <Icon
                                icon={'newFeed'}
                                heightAndWidth="25px"
                                color="purple"
                            />
                        </SectionCircle>
                    </Margin>
                    <MessageBox title="No Updates (yet)">
                        Get updates from Spaces you follow or conversation you
                        participate in.
                    </MessageBox>
                </NoActivitiesContainer>
            </Margin>
        )
    }

    renderActivities(activities: HomeFeedState['activityItems']) {
        const lastSeenLine = new LastSeenLineState(
            this.state.lastSeenTimestamp ?? null,
        )

        return mapOrderedMap(activities, (item) => {
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
            } else {
                throw new Error(
                    `Received unsupported activity type to render: ${
                        (item as ActivityItem).type
                    }`,
                )
            }

            return (
                <React.Fragment key={result.key}>
                    {shouldRenderLastSeenLine && (
                        <LastSeenLineContainer
                            shouldShowNewLine={this.state.shouldShowNewLine}
                            id="lastSeenLine"
                        >
                            <LastSeenLine />
                        </LastSeenLineContainer>
                    )}
                    {result.rendered}
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
                                    id: activityItem.listReference.id as string,
                                }}
                            >
                                {activityItem.listName}
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
                    icon={'commentEmpty'}
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
        pageItem,
        options,
    ) => {
        const pageInfo = this.state.pageInfo[pageItem.normalizedPageUrl]
        console.log(pageInfo)
        const pageCreator = this.state.users[pageItem.creatorReference.id]
        return {
            key: getOrderedMapIndex(pageItem.annotations, 0).reference.id,
            rendered: (
                <Margin top={'larger'} bottom="large">
                    <Margin>
                        <Margin bottom="small">
                            {this.renderActivityReason(pageItem)}
                        </Margin>
                        <PageInfoBox
                            viewportBreakpoint={this.viewportBreakpoint}
                            variant="dark-mode"
                            onClick={(e) =>
                                this.processEvent('clickPageResult', {
                                    urlToOpen: pageInfo.originalUrl,
                                    preventOpening: () => e.preventDefault(),
                                    isFeed: true,
                                })
                            }
                            type={
                                isPagePdf({ url: pageItem?.normalizedPageUrl })
                                    ? 'pdf'
                                    : 'page'
                            }
                            profilePopup={{
                                services: this.props.services,
                                storage: this.props.storage,
                                userRef: pageItem.creatorReference,
                            }}
                            pageInfo={{
                                createdWhen: pageInfo?.createdWhen,
                                updatedWhen: pageInfo?.createdWhen,
                                fullTitle: pageInfo?.fullTitle,
                                normalizedUrl: pageItem?.normalizedPageUrl,
                                originalUrl: pageInfo?.originalUrl,
                            }}
                            creator={pageCreator}
                            actions={[]}
                        />
                    </Margin>
                    <Margin left={'small'}>
                        {this.renderAnnotationsInPage(
                            pageItem.groupId,
                            pageItem,
                            pageItem.annotations,
                            options,
                        )}
                    </Margin>
                </Margin>
            ),
        }
    }

    isSeen(timestamp: number) {
        const { lastSeenTimestamp } = this.state
        return !!lastSeenTimestamp && lastSeenTimestamp > timestamp
    }

    renderAnnotationsInPage = (
        groupId: string,
        parentItem: PageActivityItem | ListActivityItem,
        annotationItems: OrderedMap<AnnotationActivityItem>,
        options: ActivityItemRendererOpts,
    ) => {
        const { state } = this

        return (
            <AnnotationsInPage
                variant="dark-mode"
                loadState="success"
                annotations={mapOrderedMap(
                    filterOrderedMap(annotationItems, (item) => {
                        if (parentItem.reason !== 'new-annotations') {
                            return true
                        }
                        if (this.isSeen(parentItem.notifiedWhen)) {
                            return true
                        }

                        const annotation = state.annotations[item.reference.id]
                        const seenState =
                            !!annotation && this.isSeen(annotation.updatedWhen)
                                ? 'seen'
                                : 'unseen'

                        return seenState !== 'seen'
                    }),
                    (annotationItem) => {
                        return this.getRenderableAnnotation(
                            annotationItem.reference,
                            !!annotationItem.replies?.length,
                        )
                    },
                )}
                getAnnotationCreator={(annotationReference) =>
                    state.users[
                        state.annotations[annotationReference.id]
                            .creatorReference.id
                    ]
                }
                profilePopupProps={{
                    services: this.props.services,
                    storage: this.props.storage,
                }}
                getAnnotationCreatorRef={(annotationReference) =>
                    state.annotations[annotationReference.id].creatorReference
                }
                getAnnotationConversation={(annotationReference) => {
                    const conversationKey = getConversationKey({
                        groupId,
                        annotationReference,
                    })
                    return this.state.conversations[conversationKey]
                }}
                getReplyCreator={(annotationReference, replyReference) => {
                    const conversationKey = getConversationKey({
                        groupId,
                        annotationReference,
                    })
                    const groupReplies = state.replies[conversationKey]
                    const reply = groupReplies?.[replyReference.id]

                    // When the reply is newly submitted, it's not in state.replies yet
                    if (reply) {
                        return state.users[reply.creatorReference.id]
                    }

                    return (
                        state.conversations[conversationKey]?.replies ?? []
                    ).find((reply) => reply.reference.id === replyReference.id)
                        ?.user
                }}
                renderBeforeReplies={(annotationReference) => {
                    const conversationKey = getConversationKey({
                        groupId,
                        annotationReference,
                    })
                    const annotationItem =
                        annotationItems.items[annotationReference.id]
                    if (!annotationItem || !annotationItem.hasEarlierReplies) {
                        return null
                    }
                    const loadState =
                        state.moreRepliesLoadStates[conversationKey] ??
                        'pristine'
                    if (loadState === 'success') {
                        return null
                    }
                    if (loadState === 'pristine') {
                        return (
                            <LoadingIndicatorBox>
                                <LoadingIndicator size={25} />
                            </LoadingIndicatorBox>
                        )
                    }
                    if (loadState === 'error') {
                        return (
                            <LoadMoreReplies>
                                Error loading earlier replies
                            </LoadMoreReplies>
                        )
                    }
                    return (
                        <LoadMoreReplies
                            onClick={() =>
                                this.processEvent('loadMoreReplies', {
                                    groupId: groupId,
                                    annotationReference,
                                    listReference: parentItem.listReference,
                                })
                            }
                        >
                            <Icon icon="clock" heightAndWidth="14px" />
                            Load older replies
                        </LoadMoreReplies>
                    )
                }}
                renderReply={(props) => {
                    const conversationKey = getConversationKey({
                        groupId,
                        annotationReference: props.annotationReference,
                    })
                    const moreRepliesLoadStates =
                        state.moreRepliesLoadStates[conversationKey] ??
                        'pristine'
                    const seenState =
                        state.lastSeenTimestamp &&
                        props.reply &&
                        (state.lastSeenTimestamp > props.reply.createdWhen
                            ? 'seen'
                            : 'unseen')
                    const shouldRender =
                        parentItem.type === 'list-item' ||
                        parentItem.reason === 'new-annotations' ||
                        seenState === 'unseen' ||
                        options.groupAlreadySeen ||
                        moreRepliesLoadStates === 'success'
                    return shouldRender && <AnnotationReply {...props} />
                }}
                newPageReplyEventHandlers={{}}
                newAnnotationReplyEventHandlers={{
                    onNewReplyInitiate: (annotationReference) => {
                        const conversationKey = getConversationKey({
                            groupId,
                            annotationReference,
                        })
                        return () =>
                            this.processEvent('initiateNewReplyToAnnotation', {
                                annotationReference,
                                conversationId: conversationKey,
                                sharedListReference: parentItem.listReference,
                            })
                    },
                    onNewReplyCancel: (annotationReference) => {
                        const conversationKey = getConversationKey({
                            groupId,
                            annotationReference,
                        })
                        return () =>
                            this.processEvent('cancelNewReplyToAnnotation', {
                                annotationReference,
                                conversationId: conversationKey,
                                sharedListReference: parentItem.listReference,
                            })
                    },
                    onNewReplyConfirm: (annotationReference) => {
                        const conversationKey = getConversationKey({
                            groupId,
                            annotationReference,
                        })
                        return () =>
                            this.processEvent('confirmNewReplyToAnnotation', {
                                annotationReference,
                                conversationId: conversationKey,
                                sharedListReference: parentItem.listReference,
                            })
                    },
                    onNewReplyEdit: (annotationReference) => {
                        const conversationKey = getConversationKey({
                            groupId,
                            annotationReference,
                        })
                        return ({ content }) =>
                            this.processEvent('editNewReplyToAnnotation', {
                                content,
                                annotationReference,
                                conversationId: conversationKey,
                                sharedListReference: parentItem.listReference,
                            })
                    },
                }}
                onToggleReplies={(event) => {
                    const conversationKey = getConversationKey({
                        groupId,
                        annotationReference: event.annotationReference,
                    })
                    return this.processEvent('toggleAnnotationReplies', {
                        ...event,
                        conversationId: conversationKey,
                        sharedListReference: parentItem.listReference,
                    })
                }}
            />
        )
    }

    renderListItem: ActivityItemRenderer<ListActivityItem> = (
        listItem,
        options,
    ) => {
        const { state } = this
        return {
            key:
                listItem.listReference.id +
                ':' +
                getOrderedMapIndex(listItem.entries, 0).normalizedUrl,
            rendered: (
                <Margin top={'larger'} bottom="large">
                    <Margin bottom="small">
                        {this.renderActivityReason(listItem)}
                    </Margin>
                    {mapOrderedMap(
                        listItem.entries,
                        (entry) => {
                            const seenState =
                                state.lastSeenTimestamp &&
                                (state.lastSeenTimestamp >
                                entry.activityTimestamp
                                    ? 'seen'
                                    : 'unseen')
                            const shouldRender =
                                options.groupAlreadySeen || seenState !== 'seen'
                            if (!shouldRender) {
                                return null
                            }
                            const actions: PageInfoBoxAction[] = []
                            if (
                                entry.annotationEntriesLoadState === 'running'
                            ) {
                                actions.push({
                                    node: (
                                        <AnnotationEntriesLoadingContainer>
                                            <Margin right="medium">
                                                <LoadingIndicator size={16} />
                                            </Margin>
                                        </AnnotationEntriesLoadingContainer>
                                    ),
                                })
                            } else if (entry.hasAnnotations) {
                                actions.push({
                                    node: (
                                        <CommentIconBox
                                            onClick={() =>
                                                this.processEvent(
                                                    'toggleListEntryActivityAnnotations',
                                                    {
                                                        listReference:
                                                            listItem.listReference,
                                                        listEntryReference:
                                                            entry.reference,
                                                        groupId:
                                                            listItem.groupId,
                                                    },
                                                )
                                            }
                                        >
                                            {/* {count.length > 0 && <Counter>{count}</Counter>} */}
                                            <Icon
                                                icon={commentImage}
                                                heightAndWidth={'16px'}
                                                hoverOff
                                            />
                                        </CommentIconBox>
                                    ),
                                })
                            }

                            const creator = state.users[entry.creator.id]
                            return (
                                <Margin
                                    bottom="small"
                                    key={entry.normalizedUrl}
                                >
                                    <PageInfoBox
                                        onClick={(e) =>
                                            this.processEvent(
                                                'clickPageResult',
                                                {
                                                    urlToOpen:
                                                        entry.originalUrl,
                                                    preventOpening: () =>
                                                        e.preventDefault(),
                                                    isFeed: true,
                                                },
                                            )
                                        }
                                        type={
                                            isPagePdf({
                                                url: entry.normalizedUrl,
                                            })
                                                ? 'pdf'
                                                : 'page'
                                        }
                                        profilePopup={{
                                            services: this.props.services,
                                            storage: this.props.storage,
                                            userRef: entry.creator,
                                        }}
                                        pageInfo={{
                                            fullTitle: entry.entryTitle,
                                            originalUrl: entry.originalUrl,
                                            updatedWhen:
                                                entry.activityTimestamp,
                                            createdWhen:
                                                entry.activityTimestamp,
                                            normalizedUrl: entry.normalizedUrl,
                                        }}
                                        creator={creator}
                                        actions={actions}
                                        variant="dark-mode"
                                    />
                                    {entry.annotationsLoadState ===
                                        'running' && (
                                        <LoadingIndicatorBox>
                                            <LoadingIndicator size={25} />
                                        </LoadingIndicatorBox>
                                    )}
                                    {entry.areAnnotationsShown &&
                                        this.renderAnnotationsInPage(
                                            listItem.groupId,
                                            listItem,
                                            entry.annotations,
                                            options,
                                        )}
                                </Margin>
                            )
                        },
                        (inputArr) =>
                            inputArr.slice(0, this.props.listActivitiesLimit),
                    )}
                    {listItem.entries.order.length >
                        this.props.listActivitiesLimit && (
                        <LoadMoreLink
                            route="collectionDetails"
                            services={this.props.services}
                            params={{ id: listItem.listReference.id as string }}
                        >
                            View All
                        </LoadMoreLink>
                    )}
                </Margin>
            ),
        }
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
                    listsSidebarProps={{
                        collaborativeLists: this.state.collaborativeLists,
                        followedLists: this.state.followedLists,
                        isShown: this.state.isListSidebarShown,
                        loadState: this.state.listSidebarLoadState,
                        onToggle: () =>
                            this.processEvent('toggleListSidebar', undefined),
                    }}
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
                <SectionCircle size="36px">
                    <Icon
                        icon={props.icon}
                        heightAndWidth="18px"
                        color="purple"
                    />
                </SectionCircle>
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
            <Icon icon="checkedRound" heightAndWidth="20px" hoverOff />
            <LastSeenLineLabel>Read</LastSeenLineLabel>
            <Separator />
        </StyledLastSeenLine>
    )
}
