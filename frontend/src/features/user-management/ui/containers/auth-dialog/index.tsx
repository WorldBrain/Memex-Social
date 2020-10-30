import React from "react";
import { UIElement } from "../../../../../main-ui/classes";
import Logic from "./logic";
import {
  AuthDialogEvent,
  AuthDialogDependencies,
  AuthDialogState,
} from "./types";
import styled from "styled-components";
import Overlay from "../../../../../main-ui/containers/overlay";
import { AuthProvider } from "../../../../../types/auth";
import Button from "../../../../../common-ui/components/button";
import TextInput from "../../../../../common-ui/components/text-input";
import { Margin } from "styled-components-spacing";

const StyledAuthDialog = styled.div`
  font-family: ${(props) => props.theme.fonts.primary};
`;
const Header = styled.div`
  text-align: center;
`;
const AuthenticationMethods = styled.div`
  display: flex;
  height: 500px;

  & > div {
    width: 350px;
    padding: 50px;
  }
`;
const EmailPasswordLogin = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  & > * {
    width: 150px;
  }
`;
const SocialLogins = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;
const SocialLoginButton = styled.div`
  padding: 10px 30px;
  background: grey;
  font-size: 12px;
  width: 200px;
  cursor: pointer;
`;
const SocialLoginIcon = styled.div<{ image: string }>``;
const SocialLoginLabel = styled.div``;

export default class AuthDialog extends UIElement<
  AuthDialogDependencies,
  AuthDialogState,
  AuthDialogEvent
> {
  constructor(props: AuthDialogDependencies) {
    super(props, { logic: new Logic(props) });
  }

  render() {
    const onSocialLogin = (event: { provider: AuthProvider }) =>
      this.processEvent("socialSignIn", event);

    return (
      this.state.isShown && (
        <Overlay
          services={this.props.services}
          onCloseRequested={() => this.processEvent("close", null)}
        >
          <StyledAuthDialog>
            <Margin bottom="medium">
              <Header>Sign up or Login</Header>
            </Margin>
            <AuthenticationMethods>
              <EmailPasswordLogin>
                <Margin bottom={"medium"}>
                  <TextInput type="email" placeholder="E-mail" />
                </Margin>
                <Margin vertical={"medium"}>
                  <TextInput type="password" placeholder="Password" />
                </Margin>
                <Button
                  type="primary-action"
                  onClick={() => this.processEvent("emailPasswordSignIn", null)}
                >
                  Next
                </Button>
              </EmailPasswordLogin>
              <SocialLogins>
                <SocialLogin
                  icon={"path to icon"}
                  provider="facebook"
                  onClick={onSocialLogin}
                />
                <SocialLogin
                  icon={"path to icon"}
                  provider="google"
                  onClick={onSocialLogin}
                />
                <SocialLogin
                  icon={"path to icon"}
                  provider="github"
                  onClick={onSocialLogin}
                />
                <SocialLogin
                  icon={"path to icon"}
                  provider="twitter"
                  onClick={onSocialLogin}
                />
              </SocialLogins>
            </AuthenticationMethods>
          </StyledAuthDialog>
        </Overlay>
      )
    );
  }
}

function SocialLogin(props: {
  icon: string;
  provider: AuthProvider;
  onClick(event: { provider: AuthProvider }): void;
}) {
  return (
    <Margin vertical="smallest">
      <SocialLoginButton
        onClick={() => props.onClick({ provider: props.provider })}
      >
        <SocialLoginIcon image={props.icon} />
        <SocialLoginLabel>
          Login with{" "}
          {props.provider.charAt(0).toUpperCase() + props.provider.slice(1)}
        </SocialLoginLabel>
      </SocialLoginButton>
    </Margin>
  );
}
