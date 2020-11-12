import React from "react";
import styled from "styled-components";
import { Margin } from "styled-components-spacing";

const StyledAuthMenu = styled.div`
  background: ${(props) => props.theme.colors.background};
  box-shadow: 0px 0px 4.19178px rgba(0, 0, 0, 0.14);
  border-radius: 3px;
`;

const MenuItem = styled.div`
  display: flex;
  align-items: center;
  cursor:pointer;
  padding: 5px 20px;

  &:hover {
    background: ${(props) => props.theme.colors.grey};
  }
`;
const MenuItemText = styled.div``;

export default function AuthMenu(props: {
  onSettingsRequested(): void;
  onLogoutRequested(): void;
}) {
  return (
    <StyledAuthMenu>
      {/*<AuthMenuItem
        label={"Settings"}
        onClick={props.onSettingsRequested}
      />*/}
      <AuthMenuItem
        label={"Logout"}
        onClick={props.onLogoutRequested}
      />
    </StyledAuthMenu>
  );
}

function AuthMenuItem(props: { label: string; icon?: string; onClick(): void }) {
  return (
    <Margin vertical={"smallest"}>
      <MenuItem onClick={props.onClick}>
        <MenuItemText>{props.label}</MenuItemText>
      </MenuItem>
    </Margin>
  );
}
