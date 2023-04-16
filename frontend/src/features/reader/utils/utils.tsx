import React from 'react'
import ReactDOM from 'react-dom'
import styled, { ThemeProvider, StyleSheetManager } from 'styled-components'
import Tooltip from '@worldbrain/memex-common/lib/in-page-ui/tooltip/container'
import { conditionallyTriggerTooltip } from '@worldbrain/memex-common/lib/in-page-ui/tooltip/utils'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import { theme } from '../../../../src/main-ui/styles/theme'

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

    // TODO: This code is fragile. There must be a better way to get these styles to the iframe
    //  The <style> tag is in the parent document because of webpack's css-loader.
    const parentDocStyleEls = document.head.querySelectorAll<HTMLElement>(
        'style[type="text/css"]',
    )
    const highlightStyleEl = Array.from(parentDocStyleEls).find((el) =>
        el.innerText.includes('memex-highlight'),
    )
    if (highlightStyleEl) {
        doc.head.appendChild(highlightStyleEl)
    }

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

export const injectHtmlToIFrame = (
    html: string,
    url: string,
    container: HTMLDivElement,
): Promise<HTMLIFrameElement> =>
    new Promise((resolve, reject) => {
        const htmlWithFixedPaths = convertRelativeUrlsToAbsolute(html, url)

        const iframe = document.createElement('iframe')
        iframe.width = '100%'
        iframe.height = '100%'
        iframe.style.border = 'none'
        iframe.id = 'memex-reader-iframe'

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

        iframe.onerror = (err) => reject(err)

        iframe.onload = () => {
            // Attach a shadow DOM root inside the iframe's document body
            const shadowRootContainer = document.createElement('div')
            shadowRootContainer.id = 'memex-tooltip-container' // NOTE: this needs to be here else tooltip won't auto-hide on click away
            iframe.contentDocument?.body.appendChild(shadowRootContainer)
            const shadowRoot = shadowRootContainer?.attachShadow({
                mode: 'open',
            })
            let showTooltipCb = () => {}

            if (shadowRoot) {
                // Create a div for the React rendering of the tooltip component (inside the shadow DOM)
                const reactContainer = document.createElement('div')
                shadowRoot.appendChild(reactContainer)

                // TODO: Properly hook this up to the rest of the app
                ReactDOM.render(
                    <StyleSheetManager target={shadowRoot as any}>
                        <ThemeProvider theme={theme}>
                            <Tooltip
                                getWindow={() => iframe.contentWindow!}
                                askAI={async (text) =>
                                    console.log('TOOLTIP: ask AI:', text)
                                }
                                createHighlight={async (text, shouldShare) =>
                                    console.log(
                                        'TOOLTIP: create highlight:',
                                        text,
                                        shouldShare,
                                    )
                                }
                                createAnnotation={async (
                                    text,
                                    shouldShare,
                                    showSpacePicker,
                                ) =>
                                    console.log(
                                        'TOOLTIP: create annotation:',
                                        text,
                                        shouldShare,
                                        showSpacePicker,
                                    )
                                }
                                onTooltipInit={(showTooltip) => {
                                    showTooltipCb = showTooltip
                                }}
                            />
                        </ThemeProvider>
                    </StyleSheetManager>,
                    reactContainer,
                )
            }

            const showTooltipListener = async (event: MouseEvent) => {
                await conditionallyTriggerTooltip({
                    getWindow: () => iframe.contentWindow!,
                    triggerTooltip: showTooltipCb,
                })
            }

            iframe.contentDocument?.body.addEventListener(
                'mouseup',
                showTooltipListener,
            )

            // TODO: Return this somewhere
            const cleanupShowTooltipListener = () => {
                iframe.contentDocument?.body.removeEventListener(
                    'mouseup',
                    showTooltipListener,
                )
            }

            container.appendChild(loadingDiv)
            console.log('Iframe loaded successfully')
            // Remove the loadingDiv and append the iframe
            container.removeChild(loadingDiv)

            resolve(iframe)
        }

        container.appendChild(iframe)

        const blob = new Blob([htmlWithFixedPaths], { type: 'text/html' })
        const blobUrl = URL.createObjectURL(blob)
        iframe.src = blobUrl
    })

export interface RemoteReaderInterface {
    say: (msg: string) => void
}

export function setupIframeHandlers(
    iframe: HTMLIFrameElement,
    bindHandlers: (getDocument: () => Document) => RemoteReaderInterface,
) {
    const iframeWindow = iframe.contentWindow as Window & {
        injected?: RemoteReaderInterface
    }
    if (!iframeWindow) {
        throw new Error(
            'Could not set up iframe handlers - contentWindow not present',
        )
    }
    const boundHandlers = bindHandlers(() => iframeWindow.document)
    iframeWindow.injected = boundHandlers

    return {
        handlers: boundHandlers,
        cleanup: () => {
            delete iframeWindow.injected
        },
    }
}

const LoadingBox = styled.div`
    display: flex;
    align-items: center;
    height: 600px;
    width: fill-available;
    justify-content: center;
`
