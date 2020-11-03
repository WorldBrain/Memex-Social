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
import { AuthError } from "../../../../../services/auth/types";
import ProfileSetupForm from "../../components/profile-setup-form";
import LoadingScreen from "../../../../../common-ui/components/loading-screen";

const FRIENDLY_ERRORS: { [Key in AuthError["reason"]]: string } = {
  "popup-blocked": "Could not open a popup for you to log in",
  "invalid-email": "Please enter a valid e-mail address",
  "user-not-found": `There's nobody registered with that e-mail address`,
  "wrong-password": "You entered a wrong password",
  "email-exists": `There's already an account with that e-mail address registered`,
  "weak-password": "Please enter a stronger password",
  unknown: "Sorry, something went wrong on our side. Please try again later",
};

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
  }
`;
const EmailPasswordLogin = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  & > *,
  input {
    width: 100%;
  }
`;
const EmailPasswordError = styled.div`
  color: red;
  font-weight: bold;
  text-align: center;
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

const Footer = styled.div`
  text-align: center;
  user-select: none;
`;
const ModeSwitch = styled.span`
  cursor: pointer;
  font-weight: bold;
`;

export default class AuthDialog extends UIElement<
  AuthDialogDependencies,
  AuthDialogState,
  AuthDialogEvent
> {
  constructor(props: AuthDialogDependencies) {
    super(props, { logic: new Logic(props) });
  }

  renderAuthForm() {
    return (
      <StyledAuthDialog>
        <Margin bottom="medium">
          <Header>
            {this.state.mode === "login" && "Login"}
            {this.state.mode === "register" && "Sign up"}
          </Header>
        </Margin>
        <AuthenticationMethods>
          <EmailPasswordLogin>
            <TextInput
              type="email"
              placeholder="E-mail"
              value={this.state.email}
              onChange={(e) =>
                this.processEvent("editEmail", { value: e.target.value })
              }
            />
            <Margin vertical={"medium"}>
              <TextInput
                type="password"
                placeholder="Password"
                value={this.state.password}
                onChange={(e) =>
                  this.processEvent("editPassword", {
                    value: e.target.value,
                  })
                }
              />
            </Margin>
            {this.state.error && (
              <Margin vertical={"medium"}>
                <EmailPasswordError>
                  {FRIENDLY_ERRORS[this.state.error]}
                </EmailPasswordError>
              </Margin>
            )}
            <Margin top={"medium"}>
              <Button
                type="primary-action"
                onClick={() => this.processEvent("emailPasswordConfirm", null)}
              >
                {this.state.mode === "login" && "Log in"}
                {this.state.mode === "register" && "Register"}
              </Button>
            </Margin>
          </EmailPasswordLogin>
          {/* <SocialLogins>
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
              </SocialLogins> */}
        </AuthenticationMethods>
        <Footer>
          {this.state.mode === "login" && (
            <>
              Don’t have an account?{" "}
              <ModeSwitch onClick={() => this.processEvent("toggleMode", null)}>
                Sign up
              </ModeSwitch>
            </>
          )}
          {this.state.mode === "register" && (
            <>
              Already have an account?{" "}
              <ModeSwitch onClick={() => this.processEvent("toggleMode", null)}>
                Log in
              </ModeSwitch>
            </>
          )}
        </Footer>
      </StyledAuthDialog>
    );
  }

  renderProfileForm() {
    return (
      <ProfileSetupForm
        displayName={this.state.displayName}
        onDisplayNameChange={(value) =>
          this.processEvent("editDisplayName", { value })
        }
        onConfirm={() => this.processEvent("confirmDisplayName", null)}
      />
    );
  }

  render() {
    if (this.state.saveState === "running") {
      return <LoadingScreen />;
    }

    // const onSocialLogin = (event: { provider: AuthProvider }) =>
    //   this.processEvent("socialSignIn", event);

    const { mode } = this.state;
    return (
      this.state.mode !== "hidden" && (
        <Overlay
          services={this.props.services}
          onCloseRequested={() => this.processEvent("close", null)}
        >
          {mode !== "profile" && this.renderAuthForm()}
          {mode === "profile" && this.renderProfileForm()}
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
