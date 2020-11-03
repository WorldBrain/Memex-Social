import React from "react";
import styled from "styled-components";
import TextInput from "../../../../common-ui/components/text-input";
import Button from "../../../../common-ui/components/button";
import AnnotationReply from "../../../content-conversations/ui/components/annotation-reply";
import { Margin } from "styled-components-spacing";

const StyledProfileSetupForm = styled.div``;
const Header = styled.div`
  text-align: center;
`;
const DisplayName = styled.div`
  text-align: center;
`;
const ExampleHeader = styled.div`
  text-align: center;
`;

export default function ProfileSetupForm(props: {
  displayName: string;
  onDisplayNameChange(value: string): void;
  onConfirm(): void;
}) {
  const placeholder = "John Doe";
  return (
    <StyledProfileSetupForm>
      <Margin bottom="small">
        <Header>Display Name</Header>
      </Margin>
      <Margin bottom="medium">
        <DisplayName>
          <TextInput
            placeholder={placeholder}
            value={props.displayName}
            onChange={(e) => props.onDisplayNameChange(e.target.value)}
          />
        </DisplayName>
      </Margin>
      <Margin bottom="small">
        <ExampleHeader>Example</ExampleHeader>
      </Margin>
      <Margin bottom="small">
        <AnnotationReply
          user={{
            displayName:
              props.displayName?.length > 0 ? props.displayName : placeholder,
          }}
          reply={{
            content:
              "This is what it looks like when you give feedback to somebody",
            createdWhen: Date.now(),
            normalizedPageUrl: "something",
          }}
        />
      </Margin>
      <Button
        type="primary-action"
        onClick={props.displayName.length ? props.onConfirm : undefined}
      >
        Confirm
      </Button>
    </StyledProfileSetupForm>
  );
}
