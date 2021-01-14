import React, {ChangeEvent} from "react";
import styled from "styled-components";
import TextInput from "../../../../common-ui/components/text-input";
import Button from "../../../../common-ui/components/button";
import AnnotationReply from "../../../content-conversations/ui/components/annotation-reply";
import { Margin } from "styled-components-spacing";

const StyledProfileSetupForm = styled.div``;
const Header = styled.div`
  text-align: center;
  font-family: ${(props) => props.theme.fonts.primary};
  font-size: 14px;
  font-weight: bold;
`;
const DisplayName = styled.div`
  text-align: center;
`;

interface Props {
  displayName: string;
  onDisplayNameChange(value: string): void;
  onConfirm(): void;
}

interface State {
  displayName: string;
}

export default class ProfileSetupForm extends React.Component<Props,State> {

    state = {displayName: ""}

    constructor(props:Props) {
        super(props);
        this.state.displayName = props.displayName;

    }

    onDisplayNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        this.setState({displayName:e.target.value})
        this.props.onDisplayNameChange(e.target.value)
    }

  render() {
    const placeholder = "John Doe";

    return (
        <StyledProfileSetupForm>
          <Margin bottom="medium">
            <Header>Set up your display name</Header>
          </Margin>
          <Margin bottom="medium">
            <DisplayName>
              <TextInput
                  placeholder={placeholder}
                  value={this.state.displayName}
                  onChange={(e) => this.onDisplayNameChange(e)}
                  onConfirm={this.props.onConfirm}
              />
            </DisplayName>
          </Margin>
          <Margin bottom="small">
            <Header>Example</Header>
          </Margin>
          <Margin bottom="small">
            <AnnotationReply
                user={{
                  displayName:
                      this.props.displayName?.length > 0 ? this.props.displayName : placeholder,
                }}
                reply={{
                  content:
                      "This is what a reply to someone's note looks like with your name attached",
                  createdWhen: Date.now(),
                  normalizedPageUrl: "something",
                }}
            />
          </Margin>
          <Button
              type="primary-action"
              onClick={this.props.displayName.length ? this.props.onConfirm : undefined}
          >
            Confirm
          </Button>
        </StyledProfileSetupForm>
    );
  }
}
