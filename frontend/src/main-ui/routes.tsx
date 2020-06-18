import * as history from "history";
import React from "react";
import { Router, Route, Switch } from "react-router";

import { Storage } from "../storage/types";
import { Services } from "../services/types";
import { EventHandlers } from "./classes/events";

import ROUTES from "../routes";
import UserHome from "./pages/user-home";
import NotFound from "./pages/not-found";
import LandingPage from "./pages/landing-page";

interface Props {
  history: history.History;
  services: Services;
  storage: Storage;
}
export default class Routes extends React.Component<Props> {
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
    return (
      <Router history={this.props.history}>
        <Switch>
          <Route
            exact
            path={ROUTES.landingPage.path}
            render={() => {
              if (this.props.services.auth.getCurrentUser()) {
                return (
                  <UserHome
                    storage={this.props.storage}
                    services={this.props.services}
                  />
                );
              } else {
                return <LandingPage services={this.props.services} />;
              }
            }}
          />
          {/* <Route expact path={ROUTES.accountSettings.path} render={() => {
                    return <AccountSettings storage={this.props.storage} services={this.props.services} />
                }} /> */}
          <Route component={NotFound} />
        </Switch>
      </Router>
    );
  }
}
