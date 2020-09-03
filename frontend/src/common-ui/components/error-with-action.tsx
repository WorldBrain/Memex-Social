import React from "react";
import { Margin } from "styled-components-spacing";
import styled from "styled-components";
import ErrorBox from "./error-box";
import SmallButton from "./small-button";

const ListNotFoundBox = styled.div`
  font-family: ${(props) => props.theme.fonts.primary};
  width: 100%;
  padding: 20px 20px;
  color: ${(props) => props.theme.colors.primary};
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  text-align: center;
`;

export default function ErrorWithAction(
  props: {
    children: React.ReactNode;
  } & (
    | {
        errorType: "internal-error";
      }
    | {
        errorType: "not-found";
        action: {
          label: string;
          url: string;
        };
      }
  )
) {
  return (
    <ListNotFoundBox>
      <Margin bottom={"large"}>
        {props.errorType === "internal-error" && (
          <ErrorBox>{props.children}</ErrorBox>
        )}
        {props.errorType === "not-found" && props.children}
      </Margin>
      {props.errorType === "internal-error" && (
        <SmallButton
          onClick={() => window.open("https://worldbrain.io/report-bugs")}
        >
          Report Problem
        </SmallButton>
      )}
      {props.errorType === "not-found" && (
        <SmallButton onClick={() => window.open(props.action.url)}>
          {props.action.label}
        </SmallButton>
      )}
    </ListNotFoundBox>
  );
}
