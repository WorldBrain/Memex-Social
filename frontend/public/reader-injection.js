console.log('injected script loaded')

document.addEventListener('DOMContentLoaded', function () {
    window.parent.injected.sendMessageFromIframe(
        'SENDING A MESSAGE FROM THE SCRIPT INJECTED FROM CF PAGES',
    )
})
