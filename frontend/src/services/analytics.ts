export class AnalyticsService {
    trackEvent(eventName: string, eventId: string) {
        const fathom = (globalThis as any)['fathom']
        if (fathom) {
            fathom.trackGoal(eventId, 0)
        }
    }
}
