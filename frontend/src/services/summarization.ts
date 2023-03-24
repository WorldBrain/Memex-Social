export class SummarizationService {
    async summarize(originalUrl: string) {
        const isStaging = process.env.REACT_APP_FIREBASE_PROJECT_ID?.includes(
            'staging',
        )
        const baseUrl = isStaging
            ? 'https://cloudflare-memex-staging.memex.workers.dev'
            : 'https://cloudfare-memex.memex.workers.dev'
        const url = `${baseUrl}/summarize`
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                originalUrl,
            }),
        })

        return (await response.json()) as
            | { status: 'success'; choices: Array<{ text: string }> }
            | { status: 'prompt-too-long' }
            | { status: 'unknown-error' }
    }
}
