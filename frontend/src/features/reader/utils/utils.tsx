import { CLOUDFLARE_WORKER_URLS } from '@worldbrain/memex-common/lib/content-sharing/storage/constants'
import { PDF_PROXY_ROUTE } from '@worldbrain/memex-common/lib/cloudflare-worker/constants'
import { ARCHIVE_PROXY_URL } from './api'
import { determineEnv } from '../../../utils/runtime-environment'

export const convertRelativeUrlsToAbsolute = async (
    html: string,
    originalUrl: string,
): Promise<string> => {
    const parsedOriginalUrl = new URL(originalUrl)
    const disableScripts = parsedOriginalUrl.hostname.endsWith('substack.com')

    const parser = new DOMParser()
    const iframeDoc = parser.parseFromString(html, 'text/html')

    let baseUrl = originalUrl
    const base = iframeDoc.querySelector(
        'html > base, head > base',
    ) as HTMLBaseElement | null
    if (base) {
        baseUrl = new URL(base.href, originalUrl).toString()
    }

    const srcElements = iframeDoc.querySelectorAll('[src]')
    for (const element of srcElements) {
        const tagName = element.tagName.toLowerCase()
        if (tagName === 'img') {
            continue
        }

        const src = element.getAttribute('src')
        if (src) {
            if (disableScripts && tagName === 'script') {
                element.setAttribute('src', '/memex-script-disabled.js')
            } else {
                const absUrl = new URL(src, baseUrl).toString()
                const proxiedUrl = `${ARCHIVE_PROXY_URL}/webarchive?url=${encodeURIComponent(
                    absUrl,
                )}`
                element.setAttribute('src', proxiedUrl)
            }
        }
    }

    // Create a <script> tag to inject our own script in there
    const script = iframeDoc.createElement('script')
    script.src = `${window.location.origin}/reader-injection.js`
    iframeDoc.head.appendChild(script)

    // if ('serviceWorker' in navigator) {
    //     try {
    //         const registration = await navigator.serviceWorker.register(
    //             `${window.parent.location.origin}/reader-sw.js`,
    //             {
    //                 scope: window.location.origin + '/',
    //             },
    //         )
    //         const worker =
    //             registration.active ??
    //             registration.waiting ??
    //             registration.installing
    //         await new Promise<void>((resolve) => {
    //             if (worker?.state === 'activated') {
    //                 resolve()
    //                 return
    //             }
    //             worker?.addEventListener('statechange', (event) => {
    //                 if (worker.state === 'activated') {
    //                     resolve()
    //                 }
    //             })
    //         })
    //         console.log(registration)
    //         if (registration.installing) {
    //             console.log('Service worker installing')
    //         } else if (registration.waiting) {
    //             console.log('Service worker installed')
    //         } else if (registration.active) {
    //             console.log('Service worker active')
    //         }
    //     } catch (error) {
    //         console.error(`Registration failed with ${error}`)
    //     }
    // }

    // ;(global as any).injected = {
    //     sendMessageFromIframe: (message: any) => {
    //         console.log('msg', message)
    //     },
    // }

    // const script = doc.createElement('script')
    // script.src = `${window.location.origin}/reader-injection.js`
    // doc.head.appendChild(script)

    const hrefElements = iframeDoc.querySelectorAll('[href]')
    for (const element of hrefElements) {
        const tagName = element.tagName.toLowerCase()
        if (tagName === 'base') {
            continue
        }

        const isLink = tagName === 'a'
        if (isLink) {
            element.setAttribute('target', '_blank')
            element.setAttribute('rel', 'noopener noreferrer')
        }
        const href = element.getAttribute('href')
        if (href) {
            let fixedUrl = ''
            try {
                fixedUrl = new URL(href, baseUrl).toString()
            } catch (e) {
                continue
            }
            if (!isLink) {
                fixedUrl = `${ARCHIVE_PROXY_URL}/webarchive?url=${encodeURIComponent(
                    fixedUrl,
                )}`
            }
            element.setAttribute('href', fixedUrl)
        }
    }

    const imgElements = iframeDoc.querySelectorAll('img')
    for (const element of imgElements) {
        const origSrc = element.getAttribute('src')
        if (!origSrc) {
            continue
        }
        const absUrl = new URL(origSrc, baseUrl).toString()
        const proxiedUrl = `${ARCHIVE_PROXY_URL}/webarchive?url=${encodeURIComponent(
            absUrl,
        )}`
        element.setAttribute('src', proxiedUrl)

        const imgElement = element as HTMLImageElement
        if (!imgElement.srcset) {
            continue
        }
        element.srcset = imgElement.srcset
            .split(',')
            .map((setEntry) => {
                const entryParts = setEntry.split(' ')
                const absUrl = new URL(entryParts[0], baseUrl).toString()
                const proxiedUrl = `${ARCHIVE_PROXY_URL}/webarchive?url=${encodeURIComponent(
                    absUrl,
                )}`
                return [proxiedUrl, ...entryParts.slice(1)].join(' ')
            })
            .join(', ')
    }

    injectIframeHighlightsCSS(document, iframeDoc)

    const serializer = new XMLSerializer()
    const modifiedHtml = serializer.serializeToString(iframeDoc)

    return modifiedHtml
}

// TODO: This code is fragile. There must be a better way to get these styles to the iframe
//  The <style>/<link> tag is in the parent document <head> because of webpack config
function injectIframeHighlightsCSS(
    parentDoc: Document,
    iframeDoc: Document,
): void {
    if (process.env.NODE_ENV === 'development') {
        // Covers development build with CSS inlined in a <style> tag
        const parentDocStyleEls = parentDoc.head.querySelectorAll<HTMLStyleElement>(
            'style[type="text/css"]',
        )
        const highlightStyleEl = Array.from(parentDocStyleEls).find((el) =>
            el.innerText.includes('memex-highlight'),
        )
        if (highlightStyleEl) {
            iframeDoc.head.appendChild(highlightStyleEl.cloneNode(true))
        }
    } else {
        // Covers production build, with separate CSS file
        const linkEls = parentDoc.head.querySelectorAll<HTMLLinkElement>(
            'link[href$=".css"]',
        )
        const highlightLinkEl = Array.from(linkEls).find((el) =>
            /main\..+\.chunk\.css$/.test(el.href),
        )

        if (highlightLinkEl) {
            const iframeLinkElement = iframeDoc.createElement('link')
            iframeLinkElement.rel = 'stylesheet'
            iframeLinkElement.href = highlightLinkEl.href
            iframeDoc.head.appendChild(iframeLinkElement)
        }
    }
}

export const waitForIframeLoad = (iframe: HTMLIFrameElement) =>
    new Promise<void>((resolve, reject) => {
        iframe.onerror = (err) => reject(err)
        iframe.onload = () => resolve()
    })

function createIframe(doc = document): HTMLIFrameElement {
    const iframe = doc.createElement('iframe')
    iframe.width = '100%'
    iframe.height = '100%'
    iframe.style.border = 'none'
    iframe.style.minHeight = '100px'
    iframe.style.display = 'flex'
    iframe.style.flex = '1'
    return iframe
}

export const createIframeForHtml = async (
    html: string,
): Promise<HTMLIFrameElement> => {
    const blob = new Blob([html], { type: 'text/html' })
    return createIframeForBlob(blob)
}

export const createIframeForBlob = async (
    blob: Blob,
): Promise<HTMLIFrameElement> => {
    const iframe = createIframe()
    const blobUrl = URL.createObjectURL(blob)
    iframe.src = blobUrl
    return iframe
}

export const createIframeForRemotePDF = (
    originalUrl: string,
): HTMLIFrameElement => {
    const iframe = createIframe()
    const workerUrl =
        determineEnv() === 'production'
            ? CLOUDFLARE_WORKER_URLS.production
            : CLOUDFLARE_WORKER_URLS.staging

    // We have a proxy set up on our CF worker to forward PDF files through, to avoid CORS issues
    const pdfProxyUrl = `${workerUrl}${PDF_PROXY_ROUTE}?url=${encodeURIComponent(
        originalUrl,
    )}`

    iframe.src = `${
        window.location.origin
    }/pdfjs/viewer.html?file=${encodeURIComponent(pdfProxyUrl)}`
    return iframe
}

export function getReaderYoutubePlayerId(normalizedPageUrl: string) {
    return `reader_youtube_player_${normalizedPageUrl}`
}
