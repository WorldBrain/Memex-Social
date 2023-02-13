export class AnalyticsService {
    trackEvent(eventName: string) {
        const fathom = (globalThis as any)['fathom']
        if (fathom) {
            fathom.trackGoal(eventName, 0)
        }
    }
}
