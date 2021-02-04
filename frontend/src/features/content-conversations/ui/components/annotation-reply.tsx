import React from "react";
import styled from "styled-components";
import { Margin } from "styled-components-spacing";
import ItemBox from "../../../../common-ui/components/item-box";
import { User } from "@worldbrain/memex-common/lib/web-interface/types/users";
import { ConversationReply } from "@worldbrain/memex-common/lib/content-conversations/types";
import ItemBoxBottom from "../../../../common-ui/components/item-box-bottom";
import Markdown from "../../../../common-ui/components/markdown";

const StyledAnnotationBox = styled.div`
  font-family: ${(props) => props.theme.fonts.primary};
`;

const ReplyContent = styled.div`
  font-size: 14px;
  font-family: ${(props) => props.theme.fonts.primary};
  color: ${(props) => props.theme.colors.primary};
  padding: 15px 15px 10px 15px;

  & p:first-child {
    margin-top: 0;
  }

  & p:last-child {
    margin-bottom: 0;
  }
`;

export interface AnnotationReplyProps {
  user?: Pick<User, "displayName"> | null;
  reply?: ConversationReply;
  renderItemBox?: (props: {
    children: React.ReactNode;
  }) => React.ReactNode;
}

export default function AnnotationReply(props: AnnotationReplyProps) {
  const renderItemBox =
    props.renderItemBox ?? ((props) => <ItemBox {...props} />);
  return (
    <>
      {renderItemBox({
        children: (
          <StyledAnnotationBox>
            <Margin>
              <ReplyContent>
                <Markdown>{props.reply?.content}</Markdown>
              </ReplyContent>
            </Margin>
            <ItemBoxBottom
              creationInfo={{
                createdWhen: props.reply?.createdWhen,
                creator: props.user,
              }}
            />
          </StyledAnnotationBox>
        ),
      })}
    </>
  );
}
