import * as coreUILogic from "ui-logic-core";
import { EventEmitter } from "events";
import { EventHandlers, EventHandler } from './events';
import { UITaskState } from '../types';

export abstract class UILogic<State, Event extends coreUILogic.UIEvent<{}>> extends coreUILogic.UILogic<State, Event> {
    private eventHandlers = new EventHandlers()

    subscribeToServiceEvent(service: { events: EventEmitter }, eventName: string, handler: EventHandler) {
        this.eventHandlers.subscribeTo(service.events, eventName, handler)
    }

    unsubscribeFromServiceEvents() {
        this.eventHandlers.unsubscribeAll()
    }

    async processUIEvent<EventName extends keyof Event>(eventName: EventName, options: coreUILogic.ProcessUIEventOptions<State, Event, EventName>) {
        if (eventName === 'cleanup') {
            this.unsubscribeFromServiceEvents()
        }

        const toReturn = await super.processUIEvent(eventName, options)

        if (eventName === 'init') {
            this.events.emit('initialized')
        }

        return toReturn
    }
}

export type UIEvent<State> = coreUILogic.UIEvent<State>
export type UIMutation<State> = coreUILogic.UIMutation<State>
export type UIEventHandler<State, Events extends coreUILogic.UIEvent<{}>, EventName extends keyof Events> = coreUILogic.UIEventHandler<State, Events, EventName>

export async function loadInitial<State extends { loadState: UITaskState }>(logic: UILogic<State, any>, loader: () => Promise<any>): Promise<void> {
    return executeUITask(logic, 'loadState', loader)
}

export async function executeUITask<State>(
    logic: UILogic<State, any>, key: keyof State, loader: () => Promise<void>
): Promise<void> {
    logic.emitMutation({ [key]: { $set: 'running' } } as any)

    try {
        await loader()
        logic.emitMutation({ [key]: { $set: 'success' } } as any)
    } catch (e) {
        console.error(e)
        logic.emitMutation({ [key]: { $set: 'error' } } as any)
    }
}
