import DOMPurify from "dompurify";
import moment from "moment";
import React from "react";
import styled from "styled-components";
import { Margin } from "styled-components-spacing";
import { SharedAnnotation } from "@worldbrain/memex-common/lib/content-sharing/types";
import ItemBox from "../components/item-box";
import UserAvatar from "./user-avatar";
import { User } from "@worldbrain/memex-common/lib/web-interface/types/users";

const commentImage = require("../../assets/img/comment.svg");
const replyImage = require("../../assets/img/reply.svg");

const StyledAnnotationBox = styled.div`
  font-family: ${(props) => props.theme.fonts.primary};
  padding: 15px 20px;
`;

const AnnotationBody = styled.span`
  background-color: ${(props) => props.theme.colors.secondary};
  white-space: normal;
  padding: 0 5px;
  box-decoration-break: clone;
  font-size: 14px;
  color: ${(props) => props.theme.colors.primary};
`;

const AnnotationComment = styled.div`
  font-size: 14px;
  color: ${(props) => props.theme.colors.primary};
`;

const AnnotationBottom = styled.div`
  display: flex;
`;
const AnnotationAvatarHolder = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const AnnotationCreationInfo = styled.div`
  display: flex;
`;
const AnnotationActions = styled.div`
  display: flex;
  flex-grow: 2;
  align-items: flex-end;
  justify-content: flex-end;
`;
const AnnotationAction = styled.div<{ image: string }>`
  display: block;
  width: 20px;
  height: 20px;
  cursor: pointer;
  background-image: url("${(props) => props.image}");
  background-size: contain;
  background-position: center center;
  background-repeat: no-repeat;
`;
const AnnotationCreationInfoDetails = styled.div``;
const AnnotationCreator = styled.div``;
const AnnotationDate = styled.div`
  font-family: "Poppins";
  font-weight: normal;
  font-size: 12px;
  color: ${(props) => props.theme.colors.primary};
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
          <AnnotationComment
            dangerouslySetInnerHTML={{
              __html: preserveLinebreaks(annotation.comment),
            }}
          />
        </Margin>
        <AnnotationBottom>
          <AnnotationCreationInfo>
            <AnnotationAvatarHolder>
              <Margin right="small">
                <UserAvatar loading={!props.creator} />
              </Margin>
            </AnnotationAvatarHolder>
            <AnnotationCreationInfoDetails>
              <AnnotationCreator>
                {props.creator?.displayName ?? <span>&nbsp;</span>}
              </AnnotationCreator>
              <AnnotationDate>
                {moment(annotation.createdWhen).format("LLL")}
              </AnnotationDate>
            </AnnotationCreationInfoDetails>
          </AnnotationCreationInfo>
          <AnnotationActions>
            {props.hasReplies && props.onToggleReplies && (
              <Margin right="small">
                <AnnotationAction
                  image={commentImage}
                  onClick={() => props.onToggleReplies?.()}
                />
              </Margin>
            )}
            {props.onInitiateReply && (
              <AnnotationAction
                image={replyImage}
                onClick={() => props.onInitiateReply?.()}
              />
            )}
          </AnnotationActions>
        </AnnotationBottom>
      </StyledAnnotationBox>
    </ItemBox>
  );
}
