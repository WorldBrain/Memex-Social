import merge from 'lodash/merge'
import * as coreUILogic from 'ui-logic-core'
import { EventEmitter } from 'events'
import { EventHandlers, EventHandler } from './events'
import { UITaskState } from '../types'

export abstract class UILogic<
    State,
    Event extends coreUILogic.UIEvent<{}>
> extends coreUILogic.UILogic<State, Event> {
    private eventHandlers = new EventHandlers()

    subscribeToServiceEvent(
        service: { events: EventEmitter },
        eventName: string,
        handler: EventHandler,
    ) {
        this.eventHandlers.subscribeTo(service.events, eventName, handler)
    }

    unsubscribeFromServiceEvents() {
        this.eventHandlers.unsubscribeAll()
    }

    emitSignal<Signal>(signal: Signal) {
        this.events.emit('signal', signal)
    }

    async processUIEvent<EventName extends keyof Event>(
        eventName: EventName,
        options: coreUILogic.ProcessUIEventOptions<State, Event, EventName>,
    ) {
        if (eventName === 'cleanup') {
            this.unsubscribeFromServiceEvents()
        }

        this.events.emit('eventIncoming', {
            eventName,
            oldState: options.previousState,
        })

        const toReturn = await super.processUIEvent(eventName, options)

        this.events.emit('eventIncoming', {
            eventName,
            oldState: options.previousState,
        })

        if (eventName === 'init') {
            this.events.emit('initialized')
        }

        return toReturn
    }
}

export type UIEvent<State> = coreUILogic.UIEvent<State>
export type UIMutation<State> = coreUILogic.UIMutation<State>
export type UIEventHandler<
    State,
    Events extends coreUILogic.UIEvent<{}>,
    EventName extends keyof Events
> = coreUILogic.UIEventHandler<State, Events, EventName>
export type UISignal<Signals extends { type: string }> = Signals

export async function loadInitial<State extends { loadState: UITaskState }>(
    logic: UILogic<State, any>,
    loader: () => Promise<void | { mutation: UIMutation<State> }>,
): Promise<{ success?: boolean }> {
    return executeUITask<State>(logic, 'loadState', loader)
}

export async function executeUITask<State extends {}>(
    logic: UILogic<State, any>,
    keyOrMutation:
        | keyof State
        | ((taskState: UITaskState) => UIMutation<State>),
    loader: () => Promise<void | {
        mutation?: UIMutation<State>
        status?: UITaskState
    }>,
): Promise<{ success: boolean }> {
    const taskStateMutation = (taskState: UITaskState): UIMutation<State> => {
        if (typeof keyOrMutation === 'function') {
            return keyOrMutation(taskState)
        }
        return { [keyOrMutation]: { $set: taskState } } as any
    }
    logic.emitMutation(taskStateMutation('running'))

    try {
        const result = await loader()
        let newTaskState: UITaskState = 'success'
        let resultMutation: UIMutation<State> = {} as any
        if (result) {
            if (result.status) {
                newTaskState = result.status
            }
            if (result.mutation) {
                resultMutation = result.mutation
            }
        }
        logic.emitMutation(
            merge(taskStateMutation(newTaskState), resultMutation),
        )
        return { success: newTaskState !== 'error' }
    } catch (e) {
        console.error(e)
        logic.emitMutation(taskStateMutation('error'))
        return { success: false }
    }
}
