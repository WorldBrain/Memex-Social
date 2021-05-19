import pick from 'lodash/pick'
import React from 'react'
import { Waypoint } from 'react-waypoint'
import styled from 'styled-components'
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
import PageInfoBox from '../../../../../common-ui/components/page-info-box'
import AnnotationsInPage from '../../../../annotations/ui/components/annotations-in-page'
import { SharedAnnotationInPage } from '../../../../annotations/ui/components/types'
import MessageBox from '../../../../../common-ui/components/message-box'
import LoadingIndicator from '../../../../../common-ui/components/loading-indicator'
import RouteLink from '../../../../../common-ui/components/route-link'
import {
    mapOrderedMap,
    getOrderedMapIndex,
    OrderedMap,
} from '../../../../../utils/ordered-map'
import { SharedAnnotationReference } from '@worldbrain/memex-common/lib/content-sharing/types'
import AnnotationReply from '../../../../content-conversations/ui/components/annotation-reply'
import ErrorBox from '../../../../../common-ui/components/error-box'

const commentImage = require('../../../../../assets/img/comment.svg')
const collectionImage = require('../../../../../assets/img/collection.svg')

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

const ActivityType = styled.div`
    white-space: nowrap;
`

const CollectionLink = styled(RouteLink)`
    display: block;
    justify-content: center;
    font-family: ${(props) => props.theme.fonts.primary};
    color: ${(props) => props.theme.colors.primary};
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
`
const ActivityReasonIcon = styled.img`
    max-width: 15 px;
    max-height: 15px;
`

const LoadingIndicatorBox = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 50px;
`

const ActivityReasonLabel = styled.div`
  font-family: ${(props) => props.theme.fonts.primary};
  font-weight: normal;
  font-size: ${(props) => props.theme.fontSizes.listTitle}:
  color: ${(props) => props.theme.colors.primary};
  display: flex;
  width: fill-available;
`

const StyledLastSeenLine = styled.div`
    display: flex;
    position: relative;
    width: 100%;
    justify-content: center;
`
const LastSeenLineBackground = styled.div`
    position: absolute;
    background: black;
    top: 50%;
    height: 2px;
    width: 100%;
    z-index: 1;
`
const LastSeenLineLabel = styled.div`
    font-family: ${(props) => props.theme.fonts.primary};
    text-align: center;
    padding: 0 20px;
    background: #f6f8fb;
    z-index: 2;
`

const LoadMoreReplies = styled.div`
    display: flex;
    justify-content: center;
    font-family: ${(props) => props.theme.fonts.primary};
    font-size: 11px;
    cursor: pointer;
    border-radius: 3px;
    &:hover {
        background: ${(props) => props.theme.colors.grey};
    }
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
        return (
            <>
                {this.renderActivities(this.state.activityItems)}
                <Waypoint
                    onEnter={() => this.processEvent('waypointHit', null)}
                />
            </>
        )
    }

    renderNoActivities() {
        return (
            <Margin vertical="largest">
                <MessageBox title="No Updates (yet)">
                    Get updates from collections you follow or conversation you
                    participate in.
                </MessageBox>
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
                        <Margin vertical="medium">
                            <LastSeenLine />
                        </Margin>
                    )}
                    {result.rendered}
                </React.Fragment>
            )
        })
    }

    renderActivityReason(activityItem: ActivityItem) {
        if (activityItem.reason === 'new-replies') {
            return <ActivityReason icon={commentImage} label="New replies" />
        }

        if (activityItem.reason === 'pages-added-to-list') {
            return (
                <ActivityReason
                    icon={collectionImage}
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
        const pageCreator = this.state.users[pageItem.creatorReference.id]
        return {
            key: getOrderedMapIndex(pageItem.annotations, 0).reference.id,
            rendered: (
                <Margin bottom="large">
                    <Margin>
                        <Margin bottom="small">
                            {this.renderActivityReason(pageItem)}
                        </Margin>
                        <PageInfoBox
                            profilePopup={{
                                services: this.props.services,
                                storage: this.props.storage,
                                userRef: pageItem.creatorReference,
                            }}
                            pageInfo={{
                                createdWhen: Date.now(),
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

    renderAnnotationsInPage = (
        groupId: string,
        parentItem: PageActivityItem | ListActivityItem,
        annotationItems: OrderedMap<AnnotationActivityItem>,
        options: ActivityItemRendererOpts,
    ) => {
        const { state } = this

        return (
            <AnnotationsInPage
                loadState="success"
                annotations={mapOrderedMap(
                    annotationItems,
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
                    if (loadState === 'running') {
                        return (
                            <LoadMoreReplies>
                                <LoadingIndicator />
                            </LoadMoreReplies>
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
                                })
                            }
                        >
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
                <Margin bottom="large">
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

                            const creator = state.users[entry.creator.id]
                            return (
                                <>
                                    <Margin
                                        bottom="small"
                                        key={entry.normalizedUrl}
                                    >
                                        <PageInfoBox
                                            profilePopup={{
                                                services: this.props.services,
                                                storage: this.props.storage,
                                                userRef: entry.creator,
                                            }}
                                            pageInfo={{
                                                fullTitle: entry.entryTitle,
                                                originalUrl: entry.originalUrl,
                                                createdWhen:
                                                    entry.activityTimestamp,
                                                normalizedUrl:
                                                    entry.normalizedUrl,
                                            }}
                                            creator={creator}
                                            actions={
                                                entry.hasAnnotations
                                                    ? [
                                                          {
                                                              image: commentImage,
                                                              onClick: () =>
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
                                                                  ),
                                                          },
                                                      ]
                                                    : []
                                            }
                                        />
                                        {entry.annotationsLoadState ===
                                            'running' && (
                                            <LoadingIndicatorBox>
                                                <LoadingIndicator />
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
                                </>
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
        const viewportWidth = this.getBreakPoints()

        return (
            <>
                <DocumentTitle
                    documentTitle={this.props.services.documentTitle}
                    subTitle={`Collaboration Feed`}
                />
                <DefaultPageLayout
                    services={this.props.services}
                    storage={this.props.storage}
                    viewportBreakpoint={viewportWidth}
                    hideActivityIndicator
                >
                    <ErrorBox>You need to login to view your feed.</ErrorBox>
                </DefaultPageLayout>
            </>
        )
    }

    render() {
        const viewportWidth = this.getBreakPoints()

        if (this.state.needsAuth) {
            return this.renderNeedsAuth()
        }

        return (
            <>
                <DocumentTitle
                    documentTitle={this.props.services.documentTitle}
                    subTitle={`Collaboration Feed`}
                />
                <DefaultPageLayout
                    services={this.props.services}
                    storage={this.props.storage}
                    viewportBreakpoint={viewportWidth}
                    hideActivityIndicator
                    listsSidebarProps={{
                        collaborativeLists: this.state.collaborativeLists,
                        followedLists: this.state.followedLists,
                        isShown: this.state.isListSidebarShown,
                        loadState: this.state.listSidebarLoadState,
                        onSidebarToggle: () =>
                            this.processEvent('toggleListSidebar', undefined),
                    }}
                >
                    {this.renderContent()}
                </DefaultPageLayout>
            </>
        )
    }
}

const ActivityReason = (props: { icon: string; label: React.ReactChild }) => {
    return (
        <StyledActivityReason>
            <StyledIconMargin right="small">
                <ActivityReasonIcon src={props.icon} />
            </StyledIconMargin>
            <ActivityReasonLabel>{props.label}</ActivityReasonLabel>
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
            <LastSeenLineBackground />
            <LastSeenLineLabel>Seen</LastSeenLineLabel>
        </StyledLastSeenLine>
    )
}
