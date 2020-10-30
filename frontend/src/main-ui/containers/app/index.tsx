import React from "react";
import { UIElement, UIElementServices } from "../../classes";
import { EventHandlers } from "../../classes/events";
import AuthDialog from "../../../features/user-management/ui/containers/auth-dialog";
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
        <AuthDialog services={this.props.services} />
      </div>
    );
  }
}

export default App;
