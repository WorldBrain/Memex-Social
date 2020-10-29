import React from "react";
import styled from "styled-components";
import { UITaskState } from "../../../../main-ui/types";
import LoadingIndicator from "../../../../common-ui/components/loading-indicator";
import ErrorBox from "../../../../common-ui/components/error-box";
import { Margin } from "styled-components-spacing";
import {
  SharedAnnotation,
  SharedAnnotationReference,
} from "@worldbrain/memex-common/lib/content-sharing/types";
import AnnotationBox from "./annotation-box";
import {
  AnnotationConversationStates,
  AnnotationConversationState,
} from "../../../content-conversations/ui/types";
import { User } from "@worldbrain/memex-common/lib/web-interface/types/users";
import AnnotationReply from "../../../content-conversations/ui/components/annotation-reply";

const AnnotationContainer = styled.div`
  display: flex;
  justify-content: center;
`;

const AnnotationLine = styled.span`
  height: auto;
  width: 4px;
  background: #e0e0e0;
  margin: -8px 10px 4px;
`;

const AnnotationReplyContainer = styled.div`
  padding-top: 0.5rem;
  border-left: 4px solid #e0e0e0;
  padding-left: 10px;
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

const NewReplyTextArea = styled.textarea<{ editing: boolean }>`
  width: 100%;
  height: ${(props) => (props.editing ? "150px" : "40px")};
  border: 0;
  background: ${(props) => props.theme.colors.grey};
  border-radius: 3px;
  padding: 10px;
  font-family: ${(props) => props.theme.fonts.primary};
  font-size: 14px;
  outline: none;
`;

const NewReplyActions = styled.div`
  display: flex;
  font-family: ${(props) => props.theme.fonts.primary};
`;

const NewReplyConfirm = styled.div`
  cursor: pointer;
  border-radius: 3px;
  padding: 3px 6px;

  &:hover {
    background-color: #e0e0e0;
  }
`;

const NewReplyCancel = styled.div`
  color: ${(props) => props.theme.colors.warning};
  cursor: pointer;
  border-radius: 3px;
  padding: 3px 6px;

  &:hover {
    background-color: #e0e0e0;
  }
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
      <Margin key={annotation.linkId} bottom={"medium"}>
        <AnnotationBox
          annotation={annotation}
          creator={props.annotationCreator}
          hasReplies={!!conversation?.thread}
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
            {conversation.expanded &&
              conversation.replies?.map?.((replyData) => (
                <Margin key={replyData.reference.id} left="small">
                  <AnnotationReplyContainer>
                    <AnnotationReply {...replyData} />
                  </AnnotationReplyContainer>
                </Margin>
              ))}
            {conversation.expanded && (
              <Margin left="small">
                <AnnotationReplyContainer>
                  {renderNewReply(annotation, conversation)}
                </AnnotationReplyContainer>
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
        autoFocus={conversation.newReply.editing}
        value={
          conversation.newReply.editing ? conversation.newReply.content : ""
        }
        editing={conversation.newReply.editing}
        placeholder={"Add a new reply"}
        onClick={() => {
          props.onNewReplyInitiate?.({
            annotationReference: annotation.reference,
          });
        }}
        onChange={(e) =>
          props.onNewReplyEdit?.({
            annotationReference: annotation.reference,
            content: e.target.value,
          })
        }
        onKeyDown={(e) => {
          if (e.keyCode === 13 && e.ctrlKey) {
            props.onNewReplyConfirm?.({
              annotationReference: annotation.reference,
            });
          }
        }}
      />
      {conversation.newReply.editing && (
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
          <NewReplyConfirm
            onClick={() =>
              props.onNewReplyConfirm?.({
                annotationReference: annotation.reference,
              })
            }
          >
            Save
          </NewReplyConfirm>
        </NewReplyActions>
      )}
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
