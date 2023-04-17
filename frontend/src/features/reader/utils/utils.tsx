const convertRelativeUrlsToAbsolute = (html: string, url: string): string => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

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

    const urlElements = doc.querySelectorAll('[href], img[src]')
    urlElements.forEach((element: Element) => {
        if (element.tagName.toLowerCase() === 'a') {
            element.setAttribute('target', '_blank')
            element.setAttribute('rel', 'noopener noreferrer')
        }
        const replaceURL = (attrName: string) => {
            const attrValue = element.getAttribute(attrName)
            if (attrValue) {
                element.setAttribute(
                    attrName,
                    new URL(attrValue, url).toString(),
                )
            }
        }
        replaceURL('href')
        replaceURL('src')
    })

    const serializer = new XMLSerializer()
    const modifiedHtml = serializer.serializeToString(doc)

    return modifiedHtml
}

export const waitForIframeLoad = (iframe: HTMLIFrameElement) =>
    new Promise<void>((resolve, reject) => {
        iframe.onerror = (err) => reject(err)
        iframe.onload = () => resolve()
    })

export const createIframeForHtml = (
    html: string,
    originalUrl: string,
    container: HTMLElement,
): HTMLIFrameElement => {
    const htmlWithFixedPaths = convertRelativeUrlsToAbsolute(html, originalUrl)

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
