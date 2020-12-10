import React from "react";
import styled from "styled-components";
import { Services } from "../../services/types";
import { RouteMap } from "../../routes";

const StyledRouteLink = styled.a`
  text-decoration: none;
  font-family: ${(props) => props.theme.fonts.primary};
`;

export default function RouteLink(props: {
  services: Pick<Services, "router">;
  route: keyof RouteMap;
  params: { [key: string]: string };
  children: React.ReactNode;
  className?: string;
}) {
  const url = props.services.router.getUrl(props.route, props.params);
  return (
    <StyledRouteLink
      className={props.className}
      href={url}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey) {
          return;
        }
        event.preventDefault();
        props.services.router.goTo(props.route, props.params);
      }}
    >
      {props.children}
    </StyledRouteLink>
  );
}
