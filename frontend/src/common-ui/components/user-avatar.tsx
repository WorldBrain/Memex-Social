import React from "react";
import styled from "styled-components";
import LoadingIndicator from "./loading-indicator";

const AVATAR_RADIUS = "15px";

const StyledUserAvatar = styled.div<{ loading?: boolean }>`
  width: calc(${AVATAR_RADIUS} * 2);
  height: calc(${AVATAR_RADIUS} * 2);
  border-radius: ${AVATAR_RADIUS};
  background: ${(props) => (!props.loading ? "black" : "white")};
  color: white;
  text-align: center;
  line-height: calc(${AVATAR_RADIUS} * 2);
  display: flex;
  align-items: center;
  justify-content: center
`;

export default function UserAvatar(props: { loading?: boolean }) {
  return <StyledUserAvatar>{!props.loading ? "?" : <LoadingIndicator/>}</StyledUserAvatar>;
}
