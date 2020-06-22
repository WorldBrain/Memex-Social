import { UILogic, UIEvent, UIMutation } from "../../classes/logic"

export interface LandingPageState {
    foo: boolean
}
export type LandingPageEvent = UIEvent<{
    toggle: {}
}>

export default class LandingPageLogic extends UILogic<LandingPageState, LandingPageEvent> {
    getInitialState() {
        return { foo: false }
    }

    toggle(): UIMutation<LandingPageState> {
        return { $toggle: ['foo'] }
    }
}
