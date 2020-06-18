import { default as update, Spec } from 'immutability-helper';
import { EventEmitter } from "events";
import { capitalize } from "../../utils/string";
import { EventHandlers, EventHandler } from './events';
import { UITaskState } from '../types';

export type UIEvent<EventTypes> = { init : undefined, cleanup : undefined } & {
    [EventName in keyof EventTypes]: EventTypes[EventName]
}


export class UILogic< State, Event extends UIEvent<{}> > {
    events = new EventEmitter()
    private eventHandlers = new EventHandlers()
    
    getInitialState() : State | null {
        return null
    }

    emitMutation(mutation : UIMutation<State>) {
        this.events.emit('mutation', mutation)
    }

    withMutation(state : State, mutation : UIMutation<State>) {
        return update(state, mutation as any)
    }

    subscribeToServiceEvent(service : { events : EventEmitter }, eventName : string, handler : EventHandler) {
        this.eventHandlers.subscribeTo(service.events, eventName, handler)
    }

    unsubscribeFromServiceEvents() {
        this.eventHandlers.unsubscribeAll()
    }

    async processUIEvent<EventName extends keyof Event>(eventName : EventName, options : { state : State, event : Event[EventName], optional? : boolean, direct? : boolean }) : Promise<UIMutation<State> | null> {
        this.events.emit('eventIncoming', { event: eventName, oldState: options.state })
        if (eventName === 'cleanup') {
            this.unsubscribeFromServiceEvents()
        }

        const handler : Function = (this as any)[`process${capitalize(eventName as string)}`]
        if (!handler) {
            if (!options.optional) {
                throw new Error(
                    `Tried to process UI event which I couldn't find a process* method for (${eventName})`
                    // + `, but I only have these ones: ${this._listHandlers()}`
                )
            } else {
                return null
            }
        }

        const mutation = await handler.call(this, options.event, options)

        this.events.emit('eventProcessed', { event: eventName, mutation, oldState: options.state })
        if (mutation) {
            if (options.direct) {
                return mutation
            } else {
                this.emitMutation(mutation)
                return null
            }
        } else {
            return null
        }
    }

    // _listHandlers() : string {
    //     return Object.keys(Object.getPrototypeOf(this)).filter(key => key.indexOf('process') === 0).join(', ')
    // }
}

export type UIMutation<State> = Spec<State>

export async function loadInitial<State extends { loadState : UITaskState }>(logic : UILogic<State, any>, loader : () => Promise<any>) : Promise<boolean> {
    return (await executeUITask(logic, 'loadState', loader))[0]
}

export async function executeUITask<
    State,
    Key extends keyof State,
    ReturnValue
>(logic : UILogic<State, any>, key : Key, loader : () => Promise<ReturnValue>) : Promise<[false] | [true, ReturnValue]> {
    logic.emitMutation({ [key]: { $set: 'running' } } as any)

    try {
        const returned = await loader()
        logic.emitMutation({ [key]: { $set: 'success' } } as any)
        return [true, returned]
    } catch (e) {
        logic.emitMutation({ [key]: { $set: 'error' } } as any)
        return [false]
    }
}
