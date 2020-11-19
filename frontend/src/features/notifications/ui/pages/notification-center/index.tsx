import React from "react";
import { UIElement } from "../../../../../main-ui/classes";
import Logic from "./logic";
import {
  NotificationCenterEvent,
  NotificationCenterDependencies,
  NotificationCenterState,
  NotificationItem,
  PageNotificationItem,
} from "./types";
import DocumentTitle from "../../../../../main-ui/components/document-title";
import DefaultPageLayout from "../../../../../common-ui/layouts/default-page-layout";
import LoadingScreen from "../../../../../common-ui/components/loading-screen";
import { Margin } from "styled-components-spacing";
import PageInfoBox from "../../../../../common-ui/components/page-info-box";
import AnnotationsInPage from "../../../../annotations/ui/components/annotations-in-page";
import { SharedAnnotationInPage } from "../../../../annotations/ui/components/types";
import pick from "lodash/pick";
import ItemBox from "../../../../../common-ui/components/item-box";

export default class NotificationCenterPage extends UIElement<
  NotificationCenterDependencies,
  NotificationCenterState,
  NotificationCenterEvent
> {
  constructor(props: NotificationCenterDependencies) {
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
    return this.renderNotifications(this.state.notificationItems!);
  }

  renderNotifications(notifications: NotificationItem[]) {
    return notifications.map((item) => this.renderPageItem(item));
  }

  renderPageItem(pageItem: PageNotificationItem) {
    const pageInfo = this.state.pageInfo[pageItem.normalizedPageUrl];
    return (
      <React.Fragment key={pageItem.normalizedPageUrl}>
        <Margin bottom="small">
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

  renderAnnotationItems(pageItem: PageNotificationItem) {
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
            renderReplyBox={(props) => (
              <ItemBox {...props} variant="new-item" />
            )}
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
