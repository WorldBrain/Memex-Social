interface BaseMonetizationEventDetail {
    paymentPointer: string
    requestId: string
}

export interface WebMonetizationPendingEvent
    extends CustomEvent<BaseMonetizationEventDetail> {
    type: 'monetizationpending'
}

export interface WebMonetizationStartEvent
    extends CustomEvent<BaseMonetizationEventDetail> {
    type: 'monetizationstart'
}

interface WebMonetizationStopEventDetail extends BaseMonetizationEventDetail {
    finalized: boolean
}

export interface WebMonetizationStopEvent
    extends CustomEvent<WebMonetizationStopEventDetail> {
    type: 'monetizationstop'
}

interface WebMonetizationProgressEventDetail
    extends BaseMonetizationEventDetail {
    amount: string
    assetCode: string
    assetScale: number
}

export interface WebMonetizationProgressEvent
    extends CustomEvent<WebMonetizationProgressEventDetail> {
    type: 'monetizationprogress'
}

export interface WebMonetizationEventMap {
    monetizationpending: WebMonetizationPendingEvent
    monetizationstart: WebMonetizationStartEvent
    monetizationstop: WebMonetizationStopEvent
    monetizationprogress: WebMonetizationProgressEvent
}

export type WebMonetizationEvent = WebMonetizationEventMap[keyof WebMonetizationEventMap]

export type WebMonetizationState = 'stopped' | 'pending' | 'started'

type EventListener<T, E extends Event = Event> = (this: T, evt: E) => any

interface EventListenerObject<T, E extends Event = Event> {
    handleEvent(this: T, evt: E): void
}

type EventListenerOrListenerObject<T, E extends Event = Event> =
    | EventListener<T, E>
    | EventListenerObject<T, E>

// Note: The Coil extension uses a <div> instead of an EventTarget
export interface WebMonetization extends EventTarget {
    state: WebMonetizationState

    addEventListener<K extends keyof WebMonetizationEventMap>(
        type: K,
        listener: EventListenerOrListenerObject<
            WebMonetization,
            WebMonetizationEventMap[K]
        > | null,
        options?: boolean | AddEventListenerOptions,
    ): void

    removeEventListener<K extends keyof WebMonetizationEventMap>(
        type: K,
        listener: EventListenerOrListenerObject<
            WebMonetization,
            WebMonetizationEventMap[K]
        > | null,
        options?: boolean | EventListenerOptions,
    ): void
}
