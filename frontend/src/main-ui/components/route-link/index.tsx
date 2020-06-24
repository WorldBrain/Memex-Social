import React from "react";
import { UIElement, UIElementServices } from "../../classes";
import Logic, { State, Event } from "./logic";
import { RouteName } from "../../../routes";

interface Props {
  services: UIElementServices<"router">;
  children: React.ReactNode;
  route: RouteName;
  params?: { [key: string]: string };
  [key: string]: any;
}

export default class RouteLink extends UIElement<Props, State, Event> {
  render() {
    return (
      <a
        {...this.props}
        href={this.props.services.router.getUrl(
          this.props.route,
          this.props.params
        )}
        onClick={(event) => {
          if (
            event.ctrlKey ||
            event.shiftKey ||
            event.metaKey ||
            (event.button && event.button == 1)
          ) {
            return;
          }

          event.preventDefault();
          this.props.services.router.goTo(this.props.route, this.props.params);
        }}
      >
        {this.props.children}
      </a>
    );
  }
}
