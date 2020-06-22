import React from "react";
import "../../styles/global.scss";
import { UIElement, UIElementServices } from "../../classes";
import { EventHandlers } from "../../classes/events";
// import ROUTES from "../../../routes";

interface Props {
  children: React.ReactNode;
  services: UIElementServices<"auth" | "overlay" | "router">;
}

class App extends UIElement<Props> {
  private eventHandlers = new EventHandlers();

  componentDidMount() {
    this.eventHandlers.subscribeTo(
      this.props.services.auth.events,
      "changed",
      () => this.forceUpdate()
    );
  }

  componentWillUnmount() {
    this.eventHandlers.unsubscribeAll();
  }

  render() {
    // const currentRoute = this.props.services.router.matchCurrentUrl();
    // const routeInfo = currentRoute && ROUTES[currentRoute.route];

    return (
      <div>
        {this.props.children}
        <div className={this.styles.auth}></div>
      </div>
    );
  }
}

export default App;
