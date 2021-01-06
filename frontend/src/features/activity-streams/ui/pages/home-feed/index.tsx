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

const commentImage = require("../../../../../assets/img/comment.svg");

const StyledActivityReason = styled.div`
  display: flex;
  align-items: center;
`;
const ActivityReasonIcon = styled.img`
  max-width: 15 px;
  max-height: 15px;
`;

const ActivitityReasonLabel = styled.div`
  font-family: ${(props) => props.theme.fonts.primary};
  font-weight: bold;
  font-size: ${(props) => props.theme.fontSize.listTitle}
  color: ${(props) => props.theme.colors.primary};
`;

const StyledLastSeenLine = styled.div`
  display: flex;
  position: relative;
  width: 100%;
  justify-content: center;
`;
const LastSeenLineBackground = styled.div`
  position: absolute;
  background: rgba(0, 0, 0, 20%);
  top: 50%;
  left: 50%;
  height: 2px;
  width: 50%;
  transform: translateX(-50%) translateY(-50%);
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
  font-size: 10pt;
  cursor: pointer;
`;

export default class HomeFeedPage extends UIElement<
  HomeFeedDependencies,
  HomeFeedState,
  HomeFeedEvent
> {
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
      const { key, rendered } = this.renderPageItem(item);
      return (
        <React.Fragment key={key}>
          {lastSeenLine.shouldRenderBeforeItem(item) && (
            <Margin vertical="medium">
              <LastSeenLine />
            </Margin>
          )}
          {rendered}
        </React.Fragment>
      );
    });
  }

  renderActivityReason(activityItem: Pick<ActivityItem, "reason">) {
    if (activityItem.reason === "new-replies") {
      return <ActivityReason icon={commentImage} label="New replies" />;
    }
    return null;
  }

  renderPageItem(pageItem: PageActivityItem) {
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
                  Load more
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

const ActivityReason = (props: { icon: string; label: string }) => {
  return (
    <StyledActivityReason>
      <Margin right="small">
        <ActivityReasonIcon src={props.icon} />
      </Margin>
      <ActivitityReasonLabel>{props.label}</ActivitityReasonLabel>
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
