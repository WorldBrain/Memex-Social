import * as history from 'history'
import React from 'react'
import ReactDOM from 'react-dom'
import { ThemeProvider } from 'styled-components'

import { Services } from '../services/types'
import { Storage } from '../storage/types'

import Routes from './routes'
import App from './containers/app'
import { OverlayContainer } from './containers/overlay'

// import 'typeface-poppins'
import 'typeface-inter'
import GlobalStyle from './styles/global'
import { theme } from './styles/theme'
import { UiRunner } from './types'

async function runMainUi(options: {
    services: Services
    storage: Storage
    history: history.History
    mountPoint: Element
}) {
    ReactDOM.render(renderMainUi(options), options.mountPoint)
}

export function renderMainUi(options: {
    services: Services
    storage: Storage
    history: history.History
}) {
    return (
        <React.Fragment>
            <GlobalStyle />
            <ThemeProvider theme={theme}>
                <OverlayContainer services={options.services} />
                <App
                    services={options.services}
                    storage={options.storage.serverModules}
                >
                    <Routes
                        history={options.history}
                        services={options.services}
                        storage={options.storage}
                    />
                </App>
            </ThemeProvider>
        </React.Fragment>
    )
}

export function getUiMountpoint(mountPoint?: Element): Element {
    const defaultMountPointSelector = '#root'
    if (!mountPoint) {
        mountPoint =
            document.querySelector(defaultMountPointSelector) || undefined
    }
    if (!mountPoint) {
        throw new Error(
            `Could not find UI mount point: ${defaultMountPointSelector}`,
        )
    }

    return mountPoint
}

export function getDefaultUiRunner(config: { mountPoint: Element }): UiRunner {
    return (options) => runMainUi({ ...config, ...options })
}
