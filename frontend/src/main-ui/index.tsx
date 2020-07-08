import * as history from "history";
import React from "react";
import ReactDOM from "react-dom";
import { ThemeProvider } from "styled-components";

import { Services } from "../services/types";
import { Storage } from "../storage/types";

import Routes from "./routes";
import App from "./containers/app";
import { OverlayContainer } from "./containers/overlay";

import "typeface-poppins";
import GlobalStyle from "./styles/global";
import { theme } from "./styles/theme";

export default async function runMainUi(options: {
  services: Services;
  storage: Storage;
  history: history.History;
  mountPoint: Element;
}) {
  ReactDOM.render(
    <React.Fragment>
      <GlobalStyle />
      <ThemeProvider theme={theme}>
        <OverlayContainer services={options.services} />
        <App services={options.services}>
          <Routes
            history={options.history}
            services={options.services}
            storage={options.storage}
          />
        </App>
      </ThemeProvider>
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
