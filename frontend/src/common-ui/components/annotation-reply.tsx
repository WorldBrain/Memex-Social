import React from "react";
import styled from "styled-components";
import { Margin } from "styled-components-spacing";
import ItemBox from "../components/item-box";
import { User } from "@worldbrain/memex-common/lib/web-interface/types/users";
import { ConversationReply } from "@worldbrain/memex-common/lib/content-conversations/types";
import ItemBoxBottom from "./item-box-bottom";

const StyledAnnotationBox = styled.div`
  font-family: ${(props) => props.theme.fonts.primary};
  padding: 15px 20px;
`;

export default function AnnotationReply(props: {
  user?: Pick<User, "displayName"> | null;
  reply?: ConversationReply;
}) {
  return (
    <ItemBox>
      <StyledAnnotationBox>
        <Margin bottom="small">{props.reply?.content}</Margin>
        <ItemBoxBottom
          creationInfo={{
            createdWhen: props.reply?.createdWhen,
            creator: props.user,
          }}
        />
      </StyledAnnotationBox>
    </ItemBox>
  );
}
