import React from "react";
import { UIElement } from "../../../../../main-ui/classes";
import Logic from "./logic";
import {
  AuthHeaderEvent,
  AuthHeaderDependencies,
  AuthHeaderState,
} from "./types";
import styled from "styled-components";
import UserAvatar from "../../../../../common-ui/components/user-avatar";
import { Margin } from "styled-components-spacing";
import { Closable } from "../../../../../common-ui/components/closable";
import AuthMenu from "../../components/auth-menu";

const StyledAuthHeader = styled.div``;
const LoginAction = styled.div`
  cursor: pointer;
`;
const UserInfo = styled.div`
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  cursor: pointer;
`;
const DisplayName = styled.div`
  display: inline-block;
`;
const MenuContainerOuter = styled.div`
  position: relative;
`;
const MenuContainerInner = styled.div`
  position: absolute;
  display: flex;
  top: 15px;
  right: 0;
`;

export default class AuthHeader extends UIElement<
  AuthHeaderDependencies,
  AuthHeaderState,
  AuthHeaderEvent
> {
  constructor(props: AuthHeaderDependencies) {
    super(props, { logic: new Logic(props) });
  }

  render() {
    if (!this.state.user) {
      return (
        <LoginAction onClick={() => this.processEvent("login", null)}>
          Login
        </LoginAction>
      );
    }

    return (
      <StyledAuthHeader>
        <UserInfo onClick={() => this.processEvent("toggleMenu", null)}>
          <UserAvatar user={this.state.user} />
          <Margin right={"medium"}>
            <DisplayName>{this.state.user.displayName}</DisplayName>
          </Margin>
        </UserInfo>
        {this.state.showMenu && (
          <Closable onClose={() => this.processEvent("hideMenu", null)}>
            <MenuContainerOuter>
              <MenuContainerInner>
                <AuthMenu
                  onSettingsRequested={() =>
                    this.processEvent("showSettings", null)
                  }
                  onLogoutRequested={() =>
                    this.processEvent("showSettings", null)
                  }
                />
              </MenuContainerInner>
            </MenuContainerOuter>
          </Closable>
        )}
      </StyledAuthHeader>
    );
  }
}
