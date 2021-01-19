import { UIEventHandler, UIEvent } from "../../../../../main-ui/classes/logic";
import { UITaskState } from "../../../../../main-ui/types";
import { UIElementServices } from "../../../../../main-ui/classes";
import { Storage } from "../../../../../storage/types";

export interface Dependencies {
    services: UIElementServices
    storage: Storage
}

export interface State {
    followLoadState: UITaskState
    isFollowed: boolean
}

export type Events = UIEvent<{
    clickFollowBtn: null
}>

