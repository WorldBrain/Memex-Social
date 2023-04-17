import { ARCHIVE_PROXY_URL } from './api'

const convertRelativeUrlsToAbsolute = async (
    html: string,
    url: string,
): Promise<string> => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

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
    for (const element of hrefElements) {
        if (element.tagName.toLowerCase() === 'a') {
            element.setAttribute('target', '_blank')
            element.setAttribute('rel', 'noopener noreferrer')
        }
        const href = element.getAttribute('href')
        if (href) {
            element.setAttribute('href', new URL(href, url).toString())
        }
    }

    const imgElements = doc.querySelectorAll('img')
    for (const element of imgElements) {
        const origSrc = element.getAttribute('src')
        if (!origSrc) {
            continue
        }
        const absSrc = new URL(origSrc, url).toString()
        const proxiedSrc = `${ARCHIVE_PROXY_URL}/webarchive?url=${encodeURIComponent(
            absSrc,
        )}`
        element.setAttribute('src', proxiedSrc)

        const imgElement = element as HTMLImageElement
        if (!imgElement.srcset) {
            continue
        }
        if (imgElement.srcset.includes('power')) {
            console.log(imgElement.srcset)
        }
        element.srcset = imgElement.srcset
            .split(',')
            .map((setEntry) => {
                const entryParts = setEntry.split(' ')
                const absUrl = new URL(entryParts[0], url).toString()
                const proxiedUrl = `${ARCHIVE_PROXY_URL}/webarchive?url=${encodeURIComponent(
                    absUrl,
                )}`
                return [proxiedUrl, ...entryParts.slice(1)].join(' ')
            })
            .join(', ')
    }

    const serializer = new XMLSerializer()
    const modifiedHtml = serializer.serializeToString(doc)

    return modifiedHtml
}

export const waitForIframeLoad = (iframe: HTMLIFrameElement) =>
    new Promise<void>((resolve, reject) => {
        iframe.onerror = (err) => reject(err)
        iframe.onload = () => resolve()
    })

export const createIframeForHtml = async (
    html: string,
    originalUrl: string,
    container: HTMLElement,
): Promise<HTMLIFrameElement> => {
    const htmlWithFixedPaths = await convertRelativeUrlsToAbsolute(
        html,
        originalUrl,
    )

    const iframe = document.createElement('iframe')
    iframe.width = '100%'
    iframe.height = '100%'
    iframe.style.border = 'none'
    container.appendChild(iframe)

    const blob = new Blob([htmlWithFixedPaths], { type: 'text/html' })
    const blobUrl = URL.createObjectURL(blob)
    iframe.src = blobUrl
    return iframe
}
