import React from 'react'
import ReactDOM from 'react-dom'
import { ThemeProvider } from 'styled-components'
import RoutesComponent from './routes'
import App from './containers/app'
import { OverlayContainer } from './containers/overlay'

// import 'typeface-poppins'
import 'typeface-inter'
import GlobalStyle from './styles/global'
import { theme } from './styles/theme'
import { UIRunner, UIRunnerOptions } from './types'
import { monkeyPatchGlobals } from '../utils/monkey-patch'

monkeyPatchGlobals()

async function runMainUi(
    options: {
        mountPoint: Element
    } & UIRunnerOptions,
) {
    ReactDOM.render(renderMainUi(options), options.mountPoint)
}

export function renderMainUi(options: UIRunnerOptions) {
    return (
        <React.Fragment>
            <GlobalStyle />
            <ThemeProvider theme={theme}>
                <OverlayContainer services={options.services} />
                <App
                    services={options.services}
                    storage={options.storage.serverModules}
                >
                    <RoutesComponent
                        history={options.history}
                        storage={options.storage}
                        services={options.services}
                        generateServerId={options.generateServerId}
                        imageSupport={options.imageSupport}
                        getRootElement={options.getRootElement}
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

export function getDefaultUiRunner(config: { mountPoint: Element }): UIRunner {
    return (options) => runMainUi({ ...config, ...options })
}
