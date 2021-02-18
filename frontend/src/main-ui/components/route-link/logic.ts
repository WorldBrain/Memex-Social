import { UILogic, UIEvent } from '../../classes/logic'

export interface State {}
export type Event = UIEvent<{}>

export default class Logic extends UILogic<State, Event> {
    getInitialState(): State {
        return {}
    }
}
