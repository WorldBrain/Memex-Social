// self.addEventListener('install', (event) => {
// })

self.addEventListener('activate', () => {
    clients.claim()
})

self.addEventListener('fetch', (event) => {
    event.respondWith(fetch(event.request))

    // event.respondWith(async () => {
    //     let response
    //     try {
    //         response = fetch(event.request)
    //     } catch (err) {
    //         response = null
    //     }
    //     if (response?.ok) {
    //         return response
    //     }

    //     return fetch(
    //         `https://cloudflare-memex-staging.memex.workers.dev/webarchive?url=${encodeURIComponent(
    //             event.request.href,
    //         )}`,
    //     )
    // })
})
