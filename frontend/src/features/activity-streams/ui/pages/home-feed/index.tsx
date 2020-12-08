import pick from "lodash/pick";
import React from "react";
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
    return this.renderNotifications(this.state.activityItems!);
  }

  renderNotifications(notifications: ActivityItem[]) {
    return notifications.map((item) => this.renderPageItem(item));
  }

  renderPageItem(pageItem: PageActivityItem) {
    const pageInfo = this.state.pageInfo[pageItem.normalizedPageUrl];
    return (
      <React.Fragment key={pageItem.annotations[0].reference.id}>
        <Margin bottom="medium">
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
      </React.Fragment>
    );
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
            annotationConversations={this.state.conversations}
            getReplyCreator={(annotationReference, replyReference) => {
              const reply =
                state.replies[annotationReference.id][replyReference.id];
              return state.users[reply.creatorReference.id];
            }}
            // renderReplyBox={(props) => {
            //   const replies = this.state.replies[props.annotationReference.id];
            //   const reply = replies[props.replyReference.id];
            //   return (
            //     <ReplyBoxContainer>
            //       {!reply.read && (
            //         <UnreadDotContainer>
            //           {reply.markAsReadState !== "running" && (
            //             <UnreadDot
            //               title="Mark as read"
            //               onClick={() => {
            //                 this.processEvent("markAsRead", props);
            //               }}
            //             />
            //           )}
            //           {reply.markAsReadState === "running" && (
            //             <LoadingIndicator />
            //           )}
            //         </UnreadDotContainer>
            //       )}
            //       <ItemBox
            //         {...props}
            //         variant={!reply.read ? "new-item" : undefined}
            //       />
            //     </ReplyBoxContainer>
            //   );
            // }}
            hideNewReplyIfNotEditing={true}
            onNewReplyInitiate={(event) =>
              this.processEvent("initiateNewReplyToAnnotation", event)
            }
            onNewReplyCancel={(event) =>
              this.processEvent("cancelNewReplyToAnnotation", event)
            }
            onNewReplyConfirm={(event) =>
              this.processEvent("confirmNewReplyToAnnotation", event)
            }
            onNewReplyEdit={(event) =>
              this.processEvent("editNewReplyToAnnotation", event)
            }
            onToggleReplies={(event) =>
              this.processEvent("toggleAnnotationReplies", event)
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
          subTitle={`Notifications`}
        />
        <DefaultPageLayout
          services={this.props.services}
          storage={this.props.storage}
          viewportBreakpoint={viewportWidth}
          headerTitle={"Notifications"}
        >
          {this.renderContent()}
        </DefaultPageLayout>
      </>
    );
  }
}
