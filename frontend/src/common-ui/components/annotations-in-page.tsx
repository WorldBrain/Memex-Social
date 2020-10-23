import React from "react";
import styled from "styled-components";
import { UITaskState } from "../../main-ui/types";
import LoadingIndicator from "./loading-indicator";
import ErrorBox from "./error-box";
import { Margin } from "styled-components-spacing";
import {
  SharedAnnotation,
  SharedAnnotationReference,
} from "@worldbrain/memex-common/lib/content-sharing/types";
import AnnotationBox from "./annotation-box";
import {
  AnnotationConversationStates,
  AnnotationConversationState,
} from "../../features/content-conversations/ui/types";
import { User } from "@worldbrain/memex-common/lib/web-interface/types/users";
import AnnotationReply from "./annotation-reply";

const AnnotationContainer = styled.div`
  display: flex;
  justify-content: center;
`;

const AnnotationLine = styled.span`
  height: auto;
  width: 6px;
  background: #e0e0e0;
  margin: -8px 10px 5px;
`;

const AnnotationList = styled.div`
  min-height: 60px;
  width: 100%;
`;

const CenteredContent = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
`;

const NewReplyTextArea = styled.textarea`
  width: 100%;
  height: 150px;
  border: 0;
  background: ${(props) => props.theme.colors.grey};
  border-radius: 3px;
`;

const NewReplyActions = styled.div`
  display: flex;
  font-family: ${(props) => props.theme.fonts.primary};
`;

const NewReplyConfirm = styled.div`
  cursor: pointer;
`;

const NewReplyCancel = styled.div`
  color: ${(props) => props.theme.colors.warning};
  cursor: pointer;
`;

type SharedAnnotationInPage = SharedAnnotation & {
  reference: SharedAnnotationReference;
  linkId: string;
};

export default function AnnotationsInPage(props: {
  loadState: UITaskState;
  annotations?: Array<SharedAnnotationInPage> | null;
  annotationConversations?: AnnotationConversationStates | null;
  annotationCreator?: Pick<User, "displayName"> | null;
  onToggleReplies?(event: {
    annotationReference: SharedAnnotationReference;
  }): void;
  onNewReplyInitiate?(event: {
    annotationReference: SharedAnnotationReference;
  }): void;
  onNewReplyEdit?(event: {
    annotationReference: SharedAnnotationReference;
    content: string;
  }): void;
  onNewReplyConfirm?(event: {
    annotationReference: SharedAnnotationReference;
  }): void;
  onNewReplyCancel?(event: {
    annotationReference: SharedAnnotationReference;
  }): void;
}) {
  if (props.loadState === "pristine" || props.loadState === "running") {
    return (
      <AnnotationContainer>
        <AnnotationLine />
        <AnnotationList>
          <CenteredContent>
            <LoadingIndicator />
          </CenteredContent>
        </AnnotationList>
      </AnnotationContainer>
    );
  }

  if (props.loadState === "error") {
    return (
      <AnnotationContainer>
        <AnnotationLine />
        <CenteredContent>
          <Margin bottom={"medium"}>
            <ErrorBox>
              Error loading page notes. <br /> Reload page to retry.
            </ErrorBox>
          </Margin>
        </CenteredContent>
      </AnnotationContainer>
    );
  }

  if (!props.annotations) {
    return null;
  }

  const renderAnnotation = (annotation: SharedAnnotationInPage) => {
    const conversation = props.annotationConversations?.[annotation.linkId];
    return (
      <Margin key={annotation.linkId} bottom={"smallest"}>
        <AnnotationBox
          annotation={annotation}
          creator={props.annotationCreator}
          onInitiateReply={() =>
            props.onNewReplyInitiate?.({
              annotationReference: annotation.reference,
            })
          }
          onToggleReplies={() =>
            props.onToggleReplies?.({
              annotationReference: annotation.reference,
            })
          }
        />
        {conversation && (
          <>
            {conversation.replies?.map?.((replyData) => (
              <Margin key={replyData.reference.id} top="small" left="medium">
                <AnnotationReply {...replyData} />
              </Margin>
            ))}
            {conversation.newReply.editing && (
              <Margin top="small" left="medium">
                {renderNewReply(annotation, conversation)}
              </Margin>
            )}
          </>
        )}
      </Margin>
    );
  };

  const renderNewReply = (
    annotation: SharedAnnotationInPage,
    conversation: AnnotationConversationState
  ) => (
    <>
      <NewReplyTextArea
        value={conversation.newReply.content}
        onChange={(e) =>
          props.onNewReplyEdit?.({
            annotationReference: annotation.reference,
            content: e.target.value,
          })
        }
      />
      <NewReplyActions>
        <NewReplyCancel
          onClick={() =>
            props.onNewReplyCancel?.({
              annotationReference: annotation.reference,
            })
          }
        >
          Cancel
        </NewReplyCancel>
        <Margin left="medium">
          <NewReplyConfirm
            onClick={() =>
              props.onNewReplyConfirm?.({
                annotationReference: annotation.reference,
              })
            }
          >
            Save
          </NewReplyConfirm>
        </Margin>
      </NewReplyActions>
    </>
  );

  return (
    <AnnotationContainer>
      <AnnotationLine />
      <AnnotationList>
        {props.annotations.map(
          (annotation) => annotation && renderAnnotation(annotation)
        )}
      </AnnotationList>
    </AnnotationContainer>
  );
}
