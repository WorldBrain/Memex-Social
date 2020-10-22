import React from "react";
import styled from "styled-components";

const AVATAR_RADIUS = "15px";

const StyledUserAvatar = styled.div`
  width: calc(${AVATAR_RADIUS} * 2);
  height: calc(${AVATAR_RADIUS} * 2);
  border-radius: ${AVATAR_RADIUS};
  background: black;
  color: white;
  text-align: center;
  line-height: calc(${AVATAR_RADIUS} * 2);
`;

export default function UserAvatar(props: { loading?: boolean }) {
  return <StyledUserAvatar>{!props.loading && "?"}</StyledUserAvatar>;
}
