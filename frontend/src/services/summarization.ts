import { CLOUDFLARE_WORKER_URLS } from '@worldbrain/memex-common/lib/content-sharing/storage/constants'
import { determineEnv } from '../utils/runtime-environment'

export class SummarizationService {
    async summarize(originalUrl: string) {
        const baseUrl =
            determineEnv() === 'production'
                ? CLOUDFLARE_WORKER_URLS.production
                : CLOUDFLARE_WORKER_URLS.staging
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
