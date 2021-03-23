import { AuthService } from './types'

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
