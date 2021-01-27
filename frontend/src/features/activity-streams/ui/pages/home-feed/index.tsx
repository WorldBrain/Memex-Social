import pick from "lodash/pick";
import React from "react";
import { Waypoint } from "react-waypoint";
import styled from "styled-components";
import { UIElement } from "../../../../../main-ui/classes";
import Logic from "./logic";
import {
  HomeFeedEvent,
  HomeFeedDependencies,
  HomeFeedState,
  ActivityItem,
  PageActivityItem,
  ListActivityItem,
} from "./types";
import DocumentTitle from "../../../../../main-ui/components/document-title";
import DefaultPageLayout from "../../../../../common-ui/layouts/default-page-layout";
import LoadingScreen from "../../../../../common-ui/components/loading-screen";
import { Margin } from "styled-components-spacing";
import PageInfoBox from "../../../../../common-ui/components/page-info-box";
import AnnotationsInPage from "../../../../annotations/ui/components/annotations-in-page";
import { SharedAnnotationInPage } from "../../../../annotations/ui/components/types";
import MessageBox from "../../../../../common-ui/components/message-box";
import LoadingIndicator from "../../../../../common-ui/components/loading-indicator";
import RouteLink from "../../../../../common-ui/components/route-link";

const commentImage = require("../../../../../assets/img/comment.svg");
const collectionImage = require("../../../../../assets/img/collection.svg");

const StyledIconMargin = styled(Margin)`
  display: flex;
`

const LoadMoreLink = styled(RouteLink)`
  display: flex;
  justify-content: center;
  font-family: ${(props) => props.theme.fonts.primary};
  color: ${(props) => props.theme.colors.primary};
  background: white;
  font-size: 11px;
  cursor: pointer;
  border-radius: 3px; 
  align-items: center;

  &:hover {
    background: ${(props) => props.theme.colors.grey};
  }
`

const CollectionLink = styled(RouteLink)`
  display: flex;
  justify-content: center;
  font-family: ${(props) => props.theme.fonts.primary};
  color: ${(props) => props.theme.colors.primary};
  background: white;
  padding-left: 5px;
  cursor: pointer;
  align-items: center;

  &:hover {
    text-decoration: underline;
  }

`

const LoadAnnotationsLink = styled(RouteLink)`
  display: block;
  width: 20px;
  height: 20px;
  cursor: pointer;
  background-image: url("${commentImage}");
  background-size: contain;
  background-position: center center;
  background-repeat: no-repeat;
`

const StyledActivityReason = styled.div`
  display: flex;
  align-items: center;
`;
const ActivityReasonIcon = styled.img`
  max-width: 15 px;
  max-height: 15px;
`;

const ActivityReasonLabel = styled.div`
  font-family: ${(props) => props.theme.fonts.primary};
  font-weight: normal;
  font-size: ${(props) => props.theme.fontSizes.listTitle}
  color: ${(props) => props.theme.colors.primary};
  display: flex;
`;

const StyledLastSeenLine = styled.div`
  display: flex;
  position: relative;
  width: 100%;
  justify-content: center;
`;
const LastSeenLineBackground = styled.div`
  position: absolute;
  background: black;
  top: 50%;
  height: 2px;
  width: 100%;
  z-index: 1;
`;
const LastSeenLineLabel = styled.div`
  font-family: ${(props) => props.theme.fonts.primary};
  text-align: center;
  background: white;
  padding: 0 20px;
  z-index: 2;
`;

const LoadMoreReplies = styled.div`
  display: flex;
  justify-content: center;
  font-family: ${(props) => props.theme.fonts.primary};
  background: white;
  font-size: 11px;
  cursor: pointer;
  border-radius: 3px; 

  &:hover {
    background: ${(props) => props.theme.colors.grey};
  }
`;

type ActivityItemRendererResult = { key: string | number, rendered: JSX.Element }
type ActivityItemRenderer<T extends ActivityItem> = (item: T) => ActivityItemRendererResult

export default class HomeFeedPage extends UIElement<
  HomeFeedDependencies,
  HomeFeedState,
  HomeFeedEvent
> {
  static defaultProps: Partial<HomeFeedDependencies> = {
    listActivitiesLimit: 6,
  }

  constructor(props: HomeFeedDependencies) {
    super(props, { logic: new Logic(props) });
  }

  getBreakPoints() {
    let viewPortWidth = this.getViewportWidth();

    if (viewPortWidth <= 500) {
      return "mobile";
    }

    if (viewPortWidth >= 500 && viewPortWidth <= 850) {
      return "small";
    }

    if (viewPortWidth > 850) {
      return "big";
    }

    return "normal";
  }

  renderContent() {
    const { state } = this;
    if (state.loadState === "pristine" || state.loadState === "running") {
      return <LoadingScreen />;
    }
    if (state.loadState === "error") {
      return "Error";
    }
    if (!this.state.activityItems?.length) {
      return this.renderNoActivities();
    }
    return (
      <>
        {this.renderActivities(this.state.activityItems)}
        <Waypoint onEnter={() => this.processEvent("waypointHit", null)} />
      </>
    );
  }

  renderNoActivities() {
    return (
      <Margin vertical="largest">
        <MessageBox title="Nothing to see (yet)">
          Follow collections to see updates or start a conversation by replying
          to someone’s notes and highlights
        </MessageBox>
      </Margin>
    );
  }

  renderActivities(activities: ActivityItem[]) {
    const lastSeenLine = new LastSeenLineState(
      this.state.lastSeenTimestamp ?? null
    );
    return activities.map((item) => {
      let result: ActivityItemRendererResult

      if (item.type === 'page-item') {
        result = this.renderPageItem(item);
      } else if (item.type === 'list-item') {
        result = this.renderListItem(item);
      } else {
        throw new Error(`Received unsupported activity type to render: ${(item as ActivityItem).type}`)
      }

      return (
        <React.Fragment key={result.key}>
          {lastSeenLine.shouldRenderBeforeItem(item) && (
            <Margin vertical="medium">
              <LastSeenLine />
            </Margin>
          )}
          {result.rendered}
        </React.Fragment>
      );
    });
  }

  renderActivityReason(activityItem: ActivityItem) {

    if (activityItem.reason === "new-replies") {
        return <ActivityReason icon={commentImage} label="New replies" />;
    }

    if (activityItem.reason === 'pages-added-to-list') {
      return (
        <ActivityReason
          icon={collectionImage}
          label={<>Pages added to
            <CollectionLink
              route="collectionDetails"
              services={this.props.services}
              params={{ id: activityItem.listReference.id as string }}
            >
              <strong>{activityItem.listName}</strong>
            </CollectionLink>
            </>}
        />
      )
    }

    return null;
  }

  renderPageItem: ActivityItemRenderer<PageActivityItem> = (pageItem) => {
    const pageInfo = this.state.pageInfo[pageItem.normalizedPageUrl];
    return {
      key: pageItem.annotations[0].replies[0].reference.id,
      rendered: (
        <Margin bottom="large">
          <Margin bottom="small">
            <Margin bottom="small">
              {this.renderActivityReason(pageItem)}
            </Margin>
            <PageInfoBox
              pageInfo={{
                createdWhen: Date.now(),
                fullTitle: pageInfo?.fullTitle,
                normalizedUrl: pageItem?.normalizedPageUrl,
                originalUrl: pageInfo?.originalUrl,
              }}
              actions={[]}
            />
          </Margin>
          {this.renderAnnotationItems(pageItem)}
        </Margin>
      ),
    };
  }

  renderListItem: ActivityItemRenderer<ListActivityItem> = (listItem) => {
    return {
      key: listItem.listReference.id + ':' + listItem.entries[0].normalizedPageUrl,
      rendered: (
        <Margin bottom="large">
          <Margin bottom="small">
            {this.renderActivityReason(listItem)}
          </Margin>
          {listItem.entries
            .slice(0, this.props.listActivitiesLimit)
            .map((entry) => {
              const pageInfo = this.state.pageInfo[entry.normalizedPageUrl]
              return (
                <Margin bottom="small" key={entry.normalizedPageUrl}>
                  <PageInfoBox
                    pageInfo={{
                      createdWhen: Date.now(),
                      fullTitle: entry.entryTitle,
                      originalUrl: entry.originalUrl,
                      normalizedUrl: entry.normalizedPageUrl,
                    }}
                    actions={entry.hasAnnotations ? [
                      {
                        node: (
                          <LoadAnnotationsLink
                            route="collectionDetails"
                            services={this.props.services}
                            params={{ id: listItem.listReference.id as string }}
                            children={null}
                          />
                       )
                      }
                    ] : []}
                  />
                </Margin>
              )
            })
          }
          {listItem.entries.length > this.props.listActivitiesLimit && (
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
    };
  }

  renderAnnotationItems(pageItem: PageActivityItem) {
    const { state } = this;
    return (
      <Margin left={"small"}>
        <Margin bottom={"smallest"}>
          <AnnotationsInPage
            loadState="success"
            annotations={pageItem.annotations
              .map(
                (annotationItem): SharedAnnotationInPage => {
                  const annotation =
                    state.annotations[annotationItem.reference.id];
                  if (!annotation) {
                    return null as any;
                  }
                  return {
                    linkId: annotationItem.reference.id as string,
                    reference: annotationItem.reference,
                    createdWhen: annotation.updatedWhen,
                    ...pick(annotation, "comment", "body"),
                  };
                }
              )
              .filter((annotation) => !!annotation)}
            getAnnotationCreator={(annotationReference) =>
              state.users[
                state.annotations[annotationReference.id].creatorReference.id
              ]
            }
            getAnnotationConversation={() => {
              return this.state.conversations[pageItem.groupId];
            }}
            getReplyCreator={(annotationReference, replyReference) => {
              const groupReplies = state.replies[pageItem.groupId];
              const reply = groupReplies?.[replyReference.id]

              // When the reply is newly submitted, it's not in state.replies yet
              if (reply) {
                  return state.users[reply.creatorReference.id];
              }

              return (state.conversations[pageItem.groupId]?.replies ?? []).find(
                reply => reply.reference.id === replyReference.id
              )?.user;
            }}
            renderBeforeReplies={(annotationReference) => {
              const annotationItem = pageItem.annotations.find(
                (annotationItem) =>
                  annotationItem.reference.id === annotationReference.id
              );
              if (!annotationItem || !annotationItem.hasEarlierReplies) {
                return null;
              }
              const loadState =
                state.moreRepliesLoadStates[pageItem.groupId] ?? "pristine";
              if (loadState === "success") {
                return null;
              }
              if (loadState === "running") {
                return (
                  <LoadMoreReplies>
                    <LoadingIndicator />
                  </LoadMoreReplies>
                );
              }
              if (loadState === "error") {
                return (
                  <LoadMoreReplies>
                    Error loading earlier replies
                  </LoadMoreReplies>
                );
              }
              return (
                <LoadMoreReplies
                  onClick={() =>
                    this.processEvent("loadMoreReplies", {
                      groupId: pageItem.groupId,
                      annotationReference,
                    })
                  }
                >
                  Load older replies
                </LoadMoreReplies>
              );
            }}
            onNewReplyInitiate={(event) =>
              this.processEvent("initiateNewReplyToAnnotation", {
                ...event,
                conversationId: pageItem.groupId,
              })
            }
            onNewReplyCancel={(event) =>
              this.processEvent("cancelNewReplyToAnnotation", {
                ...event,
                conversationId: pageItem.groupId,
              })
            }
            onNewReplyConfirm={(event) =>
              this.processEvent("confirmNewReplyToAnnotation", {
                ...event,
                conversationId: pageItem.groupId,
              })
            }
            onNewReplyEdit={(event) =>
              this.processEvent("editNewReplyToAnnotation", {
                ...event,
                conversationId: pageItem.groupId,
              })
            }
            onToggleReplies={(event) =>
              this.processEvent("toggleAnnotationReplies", {
                ...event,
                conversationId: pageItem.groupId,
              })
            }
          />
        </Margin>
      </Margin>
    );
  }

  render() {
    const viewportWidth = this.getBreakPoints();

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
          headerTitle={"Collaboration Feed"}
          hideActivityIndicator
        >
          {this.renderContent()}
        </DefaultPageLayout>
      </>
    );
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
  );
};

class LastSeenLineState {
  alreadyRenderedLine = false;

  constructor(private lastSeenTimestamp: number | null) {}

  shouldRenderBeforeItem(activityItem: Pick<ActivityItem, "notifiedWhen">) {
    if (!this.lastSeenTimestamp) {
      return false;
    }
    if (this.alreadyRenderedLine) {
      return false;
    }

    const shouldRenderLine = activityItem.notifiedWhen < this.lastSeenTimestamp;
    if (shouldRenderLine) {
      this.alreadyRenderedLine = true;
    }
    return this.alreadyRenderedLine;
  }
}

function LastSeenLine() {
  return (
    <StyledLastSeenLine>
      <LastSeenLineBackground />
      <LastSeenLineLabel>Seen</LastSeenLineLabel>
    </StyledLastSeenLine>
  );
}
