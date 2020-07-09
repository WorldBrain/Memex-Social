import { EventEmitter } from "events";

export interface LogicUnit {
    events: EventEmitter
    eventProcessor: LogicEventProcessor
    triggerOutput: (event: string, ...args: any[]) => Promise<void>
}
export type LogicEventProcessor = (eventName: string, eventArgs: any) => Promise<void>
export type EventProcessedArgs = { event: { type: string, [key: string]: any }, mutation: any, state: any }
export default class LogicRegistryService {
    events: EventEmitter = new EventEmitter()
    logicUnits: { [name: string]: LogicUnit } = {}
    logicUnitAttributes: { [name: string]: { [key: string]: any } } = {}
    eventLoggers: { [logicUnit: string]: { [event: string]: (args: EventProcessedArgs) => void } } = {}

    constructor(private options?: { logEvents?: boolean }) {
        // if (options && options.logEvents) {
        //     this.eventLogger = (args : EventProcessedArgs) => {
        //         console.log(`EVENT/${args.event.type}/processed`, args)
        //     }
        // }
    }

    setAttribute(name: string, key: string, value: any) {
        this.logicUnitAttributes[name] = this.logicUnitAttributes[name] ?? {}
        this.logicUnitAttributes[name][key] = value
        this.events.emit('attribute.changed', { name, key, value })
    }

    getAttribute(name: string, key: string) {
        return this.logicUnitAttributes[name]?.[key]
    }

    isRegistered(name: string) {
        return !!this.logicUnits[name]
    }

    registerLogic(name: string, logicUnit: LogicUnit) {
        this.logicUnits[name] = logicUnit
        this.logicUnitAttributes[name] = {}
        this.events.emit('registered', { name, eventProcessor: logicUnit.eventProcessor })
        if (this.options && this.options.logEvents) {
            console.log(`LOGIC/registered/${name}`)

            this.eventLoggers[name] = {
                eventIncoming: (args: EventProcessedArgs) => {
                    console.log(`LOGIC/incoming/${name}/${args.event.type}`, args)
                },
                eventProcessed: (args: EventProcessedArgs) => {
                    console.log(`LOGIC/processed/${name}/${args.event.type}`, args)
                },
            }
            for (const [eventName, eventHandler] of Object.entries(this.eventLoggers[name])) {
                logicUnit.events.on(eventName, eventHandler)
            }
        }
    }

    unregisterLogic(name: string) {
        if (this.options && this.options.logEvents) {
            console.log(`LOGIC/unregistered/${name}`)

            const logicUnit = this.logicUnits[name]
            for (const [eventName, eventHandler] of Object.entries(this.eventLoggers[name])) {
                logicUnit.events.off(eventName, eventHandler)
            }
        }
        delete this.logicUnits[name]
    }
}
