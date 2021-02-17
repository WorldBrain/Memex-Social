import { UILogic, UIEvent } from '../../classes/logic'

interface State {}
type Event = UIEvent<{}>

export default class Logic extends UILogic<State, Event> {
    getInitialState() {
        return {}
    }
}
