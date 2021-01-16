import DOMPurify from "dompurify";
import React from "react";
import styled from "styled-components";
import { Margin } from "styled-components-spacing";
import { User } from "@worldbrain/memex-common/lib/web-interface/types/users";
import { SharedAnnotation } from "@worldbrain/memex-common/lib/content-sharing/types";
import ItemBox from "../../../../common-ui/components/item-box";
import ItemBoxBottom from "../../../../common-ui/components/item-box-bottom";
import Markdown from "../../../../common-ui/components/markdown";

const commentImage = require("../../../../assets/img/comment.svg");
const replyImage = require("../../../../assets/img/reply.svg");

const StyledAnnotationBox = styled.div`
  font-family: ${(props) => props.theme.fonts.primary};
  padding: 15px 20px;
`;

const AnnotationBody = styled.span`
  background-color: ${(props) => props.theme.colors.secondary};
  white-space: normal;
  padding: 2px 5px;
  box-decoration-break: clone;
  font-size: 18px;
  line-height: 20px; 
  color: ${(props) => props.theme.colors.primary};
  font-family: ${(props) => props.theme.fonts.content};
`;

const AnnotationComment = styled.div`
  font-size: 14px;
  color: ${(props) => props.theme.colors.primary};

  & p:first-child {
    margin-top: 0;
  }
`;

const DOM_PURIFY_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: ["p", "br", "#text"],
  ALLOWED_ATTR: [],
};

const preserveLinebreaks = (s: string | undefined) =>
  s
    ? (DOMPurify.sanitize(
        s.trim().replace(/\n/g, "<br>"),
        DOM_PURIFY_CONFIG
      ) as string)
    : "";

export default function AnnotationBox(props: {
  annotation: Pick<SharedAnnotation, "body" | "comment" | "createdWhen">;
  creator?: Pick<User, "displayName"> | null;
  hasReplies?: boolean;
  areRepliesExpanded?: boolean;
  onInitiateReply?(): void;
  onToggleReplies?(): void;
}) {
  const { annotation } = props;

  return (
    <ItemBox>
      <StyledAnnotationBox>
        {annotation.body && (
          <Margin bottom="small">
            <AnnotationBody
              dangerouslySetInnerHTML={{
                __html: preserveLinebreaks(annotation.body),
              }}
            />
          </Margin>
        )}
        <Margin bottom="small">
          <AnnotationComment>
            <Markdown>{annotation.comment}</Markdown>
          </AnnotationComment>
        </Margin>
        <ItemBoxBottom
          creationInfo={{
            createdWhen: annotation.createdWhen,
            creator: props.creator,
          }}
          actions={[
            props.hasReplies &&
              props.onToggleReplies && {
                key: "toggle-replies",
                image: commentImage,
                onClick: props.onToggleReplies,
              },
            props.onInitiateReply && {
              key: "new-reply",
              image: replyImage,
              onClick: props.onInitiateReply,
            },
          ]}
        />
      </StyledAnnotationBox>
    </ItemBox>
  );
}
