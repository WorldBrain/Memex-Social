import { EventEmitter } from 'events'

export type EventHandler = (...args: any[]) => void
export class EventHandlers {
    private serviceEventHandlers: [EventEmitter, string, EventHandler][] = []

    subscribeTo(
        events: EventEmitter,
        eventName: string,
        handler: EventHandler,
    ) {
        this.serviceEventHandlers.push([events, eventName, handler])
        events.on(eventName, handler)
    }

    unsubscribeAll() {
        for (const [events, event, handler] of this.serviceEventHandlers) {
            events.off(event, handler)
        }
    }
}
