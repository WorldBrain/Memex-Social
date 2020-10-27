import React from "react";
import styled from "styled-components";
import { Margin } from "styled-components-spacing";
import CreationInfo, { CreationInfoProps } from "./creation-info";

const AnnotationBottom = styled.div`
  display: flex;
`;

const AnnotationActions = styled.div`
  display: flex;
  flex-grow: 2;
  align-items: flex-end;
  justify-content: flex-end;
`;
const AnnotationAction = styled.div<{ image: string }>`
  display: flex;
  width: 20px;
  height: 20px;
  cursor: pointer;
  background-image: url("${(props) => props.image}");
  background-size: contain;
  background-position: center center;
  background-repeat: no-repeat;
  align-items: center; 
`;

const ReplyCountPill = styled.div`
  border-radius: 30px;
  background-color: #5cd9a6;
  padding: 2px 6px;
  font-size: 12px;
  width: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
`;

export default function ItemBoxBottom(props: {
  creationInfo: CreationInfoProps;
  replyCount?: number;
  toggleReplies?(): void;
  actions?: Array<
    { key: string; image: string; onClick?(): void } | null | false | undefined
  >;
}) {

  const replyCount = props.replyCount ?? ''

  return (
    <AnnotationBottom>
      <CreationInfo {...props.creationInfo} />
      <AnnotationActions>
          {replyCount > 0 && 
              <ReplyCountPill onClick={props.toggleReplies}>
                 {props.replyCount}
              </ReplyCountPill>
          }
        {props.actions?.map?.(
          (actionProps) =>
            actionProps && (
              <Margin key={actionProps.key} left="small">
                <AnnotationAction {...actionProps} />
              </Margin>
            )
        )}  
        
      </AnnotationActions>
      
    </AnnotationBottom>
  );
}
