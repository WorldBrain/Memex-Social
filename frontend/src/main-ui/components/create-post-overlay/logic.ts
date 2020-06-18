import every from 'lodash/every'
import { UILogic, UIEvent, UIMutation } from "../../classes/logic"
import { PostTag, PostDeliveryOptions, PostDeliveryAction, PostDeliveryFilterType } from "../../../types";

export interface State {
}
export type Event = UIEvent<{
}>

export default class Logic extends UILogic<State, Event> {
    constructor(private options : { }) {
        super()
    }

    getInitialState() : State {
        return {
        }
    }
}
