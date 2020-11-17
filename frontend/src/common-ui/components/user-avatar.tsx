import React from "react";
import styled from "styled-components";
import LoadingIndicator from "./loading-indicator";
import { User } from "@worldbrain/memex-common/lib/web-interface/types/users";

const AVATAR_RADIUS = "15px";

const StyledUserAvatar = styled.div<{ loading?: boolean }>`
  width: calc(${AVATAR_RADIUS} * 2);
  height: calc(${AVATAR_RADIUS} * 2);
  border-radius: ${AVATAR_RADIUS};
  background: white;
  border: 2px solid #e0e0e0;
  color: ${(props) => props.theme.colors.primary};
  text-align: center;
  line-height: calc(${AVATAR_RADIUS} * 2);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  vertical-align: middle;
  font-size: 20px;
  font-weight: 600;
  padding-top: 2px;
  padding-left: 1px;
  user-select: none;
`;

export default function UserAvatar(props: {
  user?: Pick<User, "displayName"> | null;
  loading?: boolean;
}) {
  return (
    <StyledUserAvatar>
      {!props.loading ? (
        props.user?.displayName?.charAt?.(0) ?? ""
      ) : (
        <LoadingIndicator />
      )}
    </StyledUserAvatar>
  );
}
