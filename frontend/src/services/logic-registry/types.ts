import TypedEmitter from 'typed-emitter';
import { UIMutation } from 'ui-logic-core';

export interface LogicUnit {
    events: TypedEmitter<LogicUnitEvents>;
    eventProcessor: LogicEventProcessor;
    getState(): any;
}
export interface LogicUnitEvents {
    initialized(): void;
    eventIncoming(event: EventIncomingArgs): void
    eventProcessed(event: EventProcessedArgs): void
    mutation(event: { mutation: UIMutation<any> }): void
}

export interface LogicUnitData {
    attributes: {
        [key: string]: any;
    };
    emittedSignals: any[];
}

export type LogicEventProcessor = (eventName: string, eventArgs: any) => Promise<void>;

export interface EventIncomingArgs {
    eventName: string;
    eventArgs: any;
}

export interface EventProcessedArgs {
    event: {
        type: string;
        [key: string]: any;
    };
    mutation: UIMutation<any>;
    state: any;
}

export interface LogicRegistryEvents {
    registered: (event: {
        name: string;
    } & LogicUnit) => void;
    signal: (event: {
        name: string;
        signal: any;
    }) => void;
    'attribute.changed': (event: {
        name: string;
        key: string;
        value: any;
    }) => void;
}
