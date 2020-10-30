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
`;
const MenuItemIcon = styled.div<{ icon: string }>`
  width: 16px;
  height: 16px;
  background: black;
  background-position: center center;
`;
const MenuItemText = styled.div``;

export default function AuthMenu(props: {
  onSettingsRequested(): void;
  onLogoutRequested(): void;
}) {
  return (
    <StyledAuthMenu>
      <AuthMenuItem
        label={"Settings"}
        icon={"xyz"}
        onClick={props.onSettingsRequested}
      />
      <AuthMenuItem
        label={"Logout"}
        icon={"xyz"}
        onClick={props.onLogoutRequested}
      />
    </StyledAuthMenu>
  );
}

function AuthMenuItem(props: { label: string; icon: string; onClick(): void }) {
  return (
    <Margin horizontal={"medium"} vertical={"medium"}>
      <MenuItem onClick={props.onClick}>
        <Margin right={"medium"}>
          <MenuItemIcon icon={props.icon} />
        </Margin>
        <MenuItemText>{props.label}</MenuItemText>
      </MenuItem>
    </Margin>
  );
}
