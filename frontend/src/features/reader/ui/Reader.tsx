import React, { useEffect, useState } from 'react'

import Sidemenu from './components/Sidemenu/Sidemenu'
import Toolbar from './components/Toolbar/Toolbar'
import messaging from '../utils'
import InjectedContent from './components/InjectedContent/InjectedContent'
import { attachToWindow } from '../utils/injectScripts'

const App = () => {
    const [injected, setInjected] = useState(false)

    useEffect(() => {
        const callback = async () => {
            // if you want to test with a different website - just pass in a url to getWebsiteHTML
            const response = await messaging.getWebsiteHTML()

            if (response && !injected) {
                const { archiveUrl, url, html } = response
                messaging.injectHtml(html, url, archiveUrl)
                attachToWindow()

                setInjected(true)
            }
        }

        callback()
    }, [])

    return (
        <div>
            <Toolbar />
            <Sidemenu />
            <InjectedContent />
        </div>
    )
}

export default App
