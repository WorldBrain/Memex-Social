import React from 'react'
import styled from 'styled-components'
import { ReaderPageViewProps, ReaderPageViewState } from './types'
import { Toolbar } from './components/Toolbar'
import { setupIframeComms } from '../utils/iframe'
import { getWebsiteHTML } from '../utils/api'
import { injectHtml } from '../utils/utils'
import { Sidebar } from './components/Sidebar'

export class ReaderPageView extends React.Component<
    ReaderPageViewProps,
    ReaderPageViewState
> {
    state: ReaderPageViewState = {
        injected: false,
    }
    cleanupIframeComms?: () => void

    onInjectedContentRef = async (ref: HTMLDivElement) => {
        if (!ref) {
            return
        }

        const response = await getWebsiteHTML()

        if (response && !this.state.injected) {
            const { url, html } = response
            injectHtml(html, url, ref)
            this.cleanupIframeComms = setupIframeComms({
                sendMessageFromIframe(message) {
                    console.log(message)
                },
            }).cleanup

            this.setState({ injected: true })
        }
    }

    render() {
        return (
            <div>
                <Toolbar />
                <Sidebar />
                <InjectedContent ref={this.onInjectedContentRef} />
            </div>
        )
    }
}

const InjectedContent = styled.div`
    max-width: 100%;
    width: calc(100% - 300px);
    height: calc(100% - 80px);
    position: fixed;
    background-color: #000;
    top: 80px;
    left: 0;
    bottom: 0;
`
