import React from 'react'
import ReactDOM from 'react-dom'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import { ThemeProvider } from 'styled-components'
import { theme } from '../../../../src/main-ui/styles/theme'
import styled from 'styled-components'

const convertRelativeUrlsToAbsolute = (html: string, url: string): string => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    const script = doc.createElement('script')
    script.src = `${window.location.origin}/reader-injection.js`
    doc.head.appendChild(script)

    const srcElements = doc.querySelectorAll('[src]')
    srcElements.forEach((element: Element) => {
        const src = element.getAttribute('src')
        if (src && src !== '/reader-injection.js') {
            element.setAttribute('src', new URL(src, url).toString())
        }
    })

    const hrefElements = doc.querySelectorAll('[href]')
    hrefElements.forEach((element: Element) => {
        if (element.tagName.toLowerCase() === 'a') {
            element.setAttribute('target', '_blank')
            element.setAttribute('rel', 'noopener noreferrer')
        }
        const href = element.getAttribute('href')
        if (href) {
            element.setAttribute('href', new URL(href, url).toString())
        }
    })

    const serializer = new XMLSerializer()
    const modifiedHtml = serializer.serializeToString(doc)

    return modifiedHtml
}

export const injectHtml = (
    html: string,
    url: string,
    container: HTMLDivElement,
) => {
    const htmlWithFixedPaths = convertRelativeUrlsToAbsolute(html, url)

    const iframe = document.createElement('iframe')
    iframe.width = '100%'
    iframe.height = '100%'
    iframe.style.border = 'none'

    // Create a div for the loading indicator
    const loadingDiv = document.createElement('div')
    container.appendChild(loadingDiv)

    // Render the LoadingIndicator component to the loadingDiv
    ReactDOM.render(
        <ThemeProvider theme={theme}>
            <LoadingBox>
                <LoadingIndicator size={34} />
            </LoadingBox>
        </ThemeProvider>,
        loadingDiv,
    )

    // Add event listeners for load and error events
    iframe.addEventListener('load', () => {
        console.log('Iframe loaded successfully')
        // Remove the loadingDiv and append the iframe
        container.removeChild(loadingDiv)
    })
    container.appendChild(iframe)

    const blob = new Blob([htmlWithFixedPaths], { type: 'text/html' })
    const blobUrl = URL.createObjectURL(blob)
    iframe.src = blobUrl
}

const LoadingBox = styled.div`
    display: flex;
    align-items: center;
    height: 600px;
    width: fill-available;
    justify-content: center;
`
