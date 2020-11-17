import { UILogic, UIEventHandler } from "../../../../../main-ui/classes/logic"
import { NotificationCenterEvent, NotificationCenterDependencies, NotificationCenterState } from "./types"

type EventHandler<EventName extends keyof NotificationCenterEvent> = UIEventHandler<NotificationCenterState, NotificationCenterEvent, EventName>

export default class NotificationCenterLogic extends UILogic<NotificationCenterState, NotificationCenterEvent> {
    constructor(private dependencies: NotificationCenterDependencies) {
        super()
    }

    getInitialState(): NotificationCenterState {
        return {
            loadState: 'success',
        }
    }

    init: EventHandler<'init'> = async () => {

    }
}
