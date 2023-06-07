import { AnalyticsEvent } from '@worldbrain/memex-common/lib/analytics/types'

export class AnalyticsService {
    constructor(public sendBqEvent: (event: AnalyticsEvent) => Promise<void>) {}
    trackEvent(eventName: string, eventId: string) {
        const fathom = (globalThis as any)['fathom']
        if (fathom) {
            fathom.trackGoal(eventId, 0)
        }
    }

    trackBqEvent(event: AnalyticsEvent) {
        return this.sendBqEvent(event)
    }
}
