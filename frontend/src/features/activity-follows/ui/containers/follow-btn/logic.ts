import { UILogic, UIEventHandler } from "../../../../../main-ui/classes/logic"
import { Events, State, Dependencies } from "./types"

type EventHandler<EventName extends keyof Events> = UIEventHandler<State, Events, EventName>

export default class FollowBtnLogic extends UILogic<State, Events> {
    constructor(private dependencies: Dependencies) {
        super()
    }

    getInitialState() : State {
        return {
            isFollowed: false,
            followLoadState: 'pristine',
        }
    }
}
