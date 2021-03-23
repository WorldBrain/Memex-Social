import isMatch from 'lodash/isMatch'
import { EventEmitter } from 'events'
import type TypedEmitter from 'typed-emitter'
import type {
    LogicRegistryEvents,
    LogicUnit,
    LogicUnitData,
    EventProcessedArgs,
    LogicRegistryServiceInterface,
} from './types'

export default class LogicRegistryService
    implements LogicRegistryServiceInterface {
    events: TypedEmitter<LogicRegistryEvents> = new EventEmitter()
    _logicUnits: { [name: string]: LogicUnit } = {}
    _logicUnitData: { [name: string]: LogicUnitData } = {}
    eventLoggers: {
        [logicUnit: string]: {
            [event: string]: (args: EventProcessedArgs) => void
        }
    } = {}

    constructor(private options?: { logEvents?: boolean }) {
        // if (options && options.logEvents) {
        //     this.eventLogger = (args : EventProcessedArgs) => {
        //         console.log(`EVENT/${args.event.type}/processed`, args)
        //     }
        // }
    }

    setAttribute(elementName: string, key: string, value: any) {
        const { attributes } = this._ensureLogicUnitData(elementName)
        attributes[key] = value
        this.events.emit('attribute.changed', { name: elementName, key, value })
    }

    getAttribute(elementName: string, key: string) {
        return this._logicUnitData[elementName]?.attributes?.[key]
    }

    isRegistered(elementName: string) {
        return !!this._logicUnits[elementName]
    }

    registerLogic(elementName: string, logicUnit: LogicUnit) {
        this._logicUnits[elementName] = logicUnit
        this.events.emit('registered', { name: elementName, ...logicUnit })
        if (this.options && this.options.logEvents) {
            console.log(`LOGIC/registered/${elementName}`)

            this.eventLoggers[elementName] = {
                eventIncoming: (args: EventProcessedArgs) => {
                    console.log(
                        `LOGIC/incoming/${elementName}/${args.event.type}`,
                        args,
                    )
                },
                eventProcessed: (args: EventProcessedArgs) => {
                    console.log(
                        `LOGIC/processed/${elementName}/${args.event.type}`,
                        args,
                    )
                },
            }
            // for (const [eventName, eventHandler] of Object.entries(this.eventLoggers[elementName])) {
            //     logicUnit.events.on(eventName, eventHandler)
            // }
        }
    }

    emitSignal(elementName: string, signal: any) {
        const { emittedSignals } = this._ensureLogicUnitData(elementName)
        emittedSignals.push(signal)
        this.events.emit('signal', { name: elementName, signal })
    }

    _ensureLogicUnitData(elementName: string): LogicUnitData {
        const data = (this._logicUnitData[elementName] = this._logicUnitData[
            elementName
        ] ?? { attributes: {}, emittedSignals: [] })
        return data
    }

    async waitForElement(elementName: string) {
        if (!this.isRegistered(elementName)) {
            await new Promise((resolve) => {
                const handler: LogicRegistryEvents['registered'] = (event) => {
                    if (event.name === elementName) {
                        this.events.off('registered', handler)
                        resolve()
                    }
                }
                this.events.on('registered', handler)
            })
        }
    }

    async waitForAttribute(elementName: string, attributeName: string) {
        await this.waitForElement(elementName)
        if (!this.getAttribute(elementName, attributeName)) {
            await new Promise((resolve) => {
                const handler: LogicRegistryEvents['attribute.changed'] = (
                    event,
                ) => {
                    if (
                        event.name === elementName &&
                        event.key === attributeName
                    ) {
                        this.events.off('attribute.changed', handler)
                        resolve()
                    }
                }
                this.events.on('attribute.changed', handler)
            })
        }
    }

    async waitForSignal(elementName: string, expectedSignal: any) {
        await this.waitForElement(elementName)

        for (const signal of this._logicUnitData[elementName]?.emittedSignals ??
            []) {
            if (isMatch(signal, expectedSignal)) {
                return
            }
        }

        await new Promise((resolve) => {
            const handler: LogicRegistryEvents['signal'] = (event) => {
                if (
                    event.name === elementName &&
                    isMatch(event.signal, expectedSignal)
                ) {
                    this.events.off('signal', handler)
                    resolve()
                }
            }
            this.events.on('signal', handler)
        })
    }

    processEvent(elementName: string, eventName: string, eventArgs: any) {
        return this._logicUnits[elementName].eventProcessor(
            eventName,
            eventArgs,
        )
    }

    unregisterLogic(elementName: string) {
        if (this.options && this.options.logEvents) {
            console.log(`LOGIC/unregistered/${elementName}`)

            // const logicUnit = this._logicUnits[elementName]
            // for (const [eventName, eventHandler] of Object.entries(this.eventLoggers[elementName])) {
            //     logicUnit.events.off(eventName, eventHandler)
            // }
        }
        delete this._logicUnits[elementName]
    }
}
