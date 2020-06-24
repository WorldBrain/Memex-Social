import * as history from "history";
import React from "react";
import ReactDOM from "react-dom";

import "typeface-open-sans";
import "typeface-nunito";
import "font-awesome/css/font-awesome.css";

import { Services } from "../services/types";
import { Storage } from "../storage/types";

import Routes from "./routes";
import App from "./containers/app";
import { OverlayContainer } from "./containers/overlay";

export default async function runMainUi(options: {
  services: Services;
  storage: Storage;
  history: history.History;
  mountPoint: Element;
}) {
  ReactDOM.render(
    <React.Fragment>
      <OverlayContainer services={options.services} />
      <App services={options.services}>
        <Routes
          history={options.history}
          services={options.services}
          storage={options.storage}
        />
      </App>
    </React.Fragment>,
    options.mountPoint
  );
}

export function getUiMountpoint(mountPoint?: Element): Element {
  const defaultMountPointSelector = "#root";
  if (!mountPoint) {
    mountPoint = document.querySelector(defaultMountPointSelector) || undefined;
  }
  if (!mountPoint) {
    throw new Error(
      `Could not find UI mount point: ${defaultMountPointSelector}`
    );
  }

  return mountPoint;
}
