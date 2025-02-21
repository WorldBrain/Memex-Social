import createResolvable from '@josephg/resolvable'
import type { User } from '@worldbrain/memex-common/lib/web-interface/types/users'
import type { AuthService } from './types'

export function waitForAuth(
    auth: AuthService,
): { waitingForAuth: Promise<void>; stopWaiting: () => void } {
    let destroyHandler = () => {}
    const stopWaiting = () => {
        destroyHandler()
        destroyHandler = () => {}
    }
    return {
        waitingForAuth: new Promise((resolve) => {
            const handler = () => {
                if (auth.getCurrentUser()) {
                    stopWaiting()
                    resolve()
                }
            }
            destroyHandler = () =>
                auth.events.removeListener('changed', handler)
            auth.events.addListener('changed', handler)
        }),
        stopWaiting,
    }
}

export async function* userChanges(
    authService: Pick<AuthService, 'events'>,
): AsyncIterableIterator<User | null> {
    let resolvable = createResolvable<User | null>()
    authService.events.on('changed', (user) => {
        const oldResolvable = resolvable
        resolvable = createResolvable()
        oldResolvable.resolve(user)
    })

    while (true) {
        const user = await resolvable
        yield user
    }
}
