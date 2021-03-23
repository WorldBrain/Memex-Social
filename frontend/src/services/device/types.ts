import type TypedEventEmitter from 'typed-emitter'

export type RectSize = { width: number; height: number }

export interface DeviceServiceEvents {
    rootResize: () => void
}

export interface DeviceServiceInterface {
    processRootResize: () => void
    rootSize: RectSize
    events: TypedEventEmitter<DeviceServiceEvents>
}
