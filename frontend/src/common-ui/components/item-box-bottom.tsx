import React from "react";
import styled from "styled-components";
import { Margin } from "styled-components-spacing";
import CreationInfo, { CreationInfoProps } from "./creation-info";

const Bottom = styled.div`
  display: flex;
`;

const Actions = styled.div`
  display: flex;
  flex-grow: 2;
  align-items: flex-end;
  justify-content: flex-end;
`;
const Action = styled.div<{ image: string }>`
  display: block;
  width: 20px;
  height: 20px;
  cursor: pointer;
  background-image: url("${(props) => props.image}");
  background-size: contain;
  background-position: center center;
  background-repeat: no-repeat;
`;

export default function ItemBoxBottom(props: {
  creationInfo: CreationInfoProps;
  replyCount?: number;
  actions?: Array<
    { key: string; image: string; onClick?(): void } | null | false | undefined
  >;
}) {
  return (
    <Bottom>
      <CreationInfo {...props.creationInfo} />
      <Actions>
        {props.actions?.map?.(
          (actionProps) =>
            actionProps && (
              <Margin key={actionProps.key} left="small">
                <Action {...actionProps} />
              </Margin>
            )
        )}
      </Actions>
    </Bottom>
  );
}
