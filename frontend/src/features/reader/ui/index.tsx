import React from 'react'
import { ReaderPageViewProps, ReaderPageViewState } from './types'
import Sidemenu from './components/Sidemenu/Sidemenu'
import Toolbar from './components/Toolbar/Toolbar'
import messaging from '../utils'
import InjectedContent from './components/InjectedContent/InjectedContent'
import { attachToWindow } from '../utils/injectScripts'

export class ReaderPageView extends React.Component<
    ReaderPageViewProps,
    ReaderPageViewState
> {
    state: ReaderPageViewState = {
        injected: false,
    }

    async componentDidMount() {
        const response = await messaging.getWebsiteHTML()

        if (response && !this.state.injected) {
            const { archiveUrl, url, html } = response
            messaging.injectHtml(html, url, archiveUrl)
            attachToWindow()

            this.setState({ injected: true })
        }
    }

    render() {
        return (
            <div>
                <Toolbar />
                <Sidemenu />
                <InjectedContent />
            </div>
        )
    }
}
