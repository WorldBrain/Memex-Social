import { UILogic, UIMutation, UIEvent } from "../main-ui/classes/logic"

export class TestLogicContainer<
    State = {},
    Event extends UIEvent<{}> = UIEvent<{}>
    > {
    public state: State
    private eventMutations: Array<UIMutation<State>> = []

    constructor(public logic: UILogic<State, Event>) {
        this.state = logic.getInitialState()
        this.logic.events.addListener('mutation', mutation =>
            this.processMutation(mutation),
        )
    }

    async init() {
        return this.processEvent('init', undefined, { optional: true })
    }

    async cleanup() {
        const cleanupMutations = this.processEvent('cleanup', undefined, { optional: true })
        this.logic.events.removeAllListeners()
        return cleanupMutations
    }

    async processEvent<EventName extends keyof Event>(
        eventName: EventName,
        event: Event[EventName],
        options?: { optional: boolean },
    ) {
        this.eventMutations = []
        const mutation = await this.logic.processUIEvent(eventName, {
            previousState: this.state,
            event,
            direct: true,
            optional: options && options.optional,
        })
        if (mutation) {
            this.processMutation(mutation)
        }
        return this.eventMutations
    }

    processMutation(mutation: UIMutation<State>) {
        this.eventMutations.push(mutation)
        if (this.logic) {
            const newState = this.logic.withMutation(
                this.state,
                mutation as any,
            )
            this.state = newState
        }
    }
}
