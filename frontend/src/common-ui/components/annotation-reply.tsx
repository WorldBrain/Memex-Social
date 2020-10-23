import DOMPurify from "dompurify";
import React from "react";
import styled from "styled-components";
import { Margin } from "styled-components-spacing";
import { SharedAnnotation } from "@worldbrain/memex-common/lib/content-sharing/types";
import ItemBox from "../components/item-box";
import { User } from "@worldbrain/memex-common/lib/web-interface/types/users";
import CreationInfo from "./creation-info";
import { ConversationReply } from "@worldbrain/memex-common/lib/content-conversations/types";
import ItemBoxBottom from "./item-box-bottom";

const commentImage = require("../../assets/img/comment.svg");
const replyImage = require("../../assets/img/reply.svg");

const StyledAnnotationBox = styled.div`
  font-family: ${(props) => props.theme.fonts.primary};
  padding: 15px 20px;
`;

export default function AnnotationReply(props: {
  creator?: Pick<User, "displayName"> | null;
  reply?: ConversationReply;
}) {
  return (
    <ItemBox>
      <StyledAnnotationBox>
        <Margin bottom="small">{props.reply?.content}</Margin>
        <ItemBoxBottom
          creationInfo={{
            createdWhen: props.reply?.createdWhen,
            creator: props.creator,
          }}
        />
      </StyledAnnotationBox>
    </ItemBox>
  );
}
