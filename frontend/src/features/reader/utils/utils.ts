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

    container.appendChild(iframe)

    const blob = new Blob([htmlWithFixedPaths], { type: 'text/html' })
    const blobUrl = URL.createObjectURL(blob)
    iframe.src = blobUrl
}
