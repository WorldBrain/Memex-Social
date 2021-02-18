import { UILogic, UIMutation } from '../../classes/logic'
import { LandingPageEvent } from './types'

export interface LandingPageState {
    foo: boolean
}
export default class LandingPageLogic extends UILogic<
    LandingPageState,
    LandingPageEvent
> {
    getInitialState() {
        return { foo: false }
    }

    toggle(): UIMutation<LandingPageState> {
        return { $toggle: ['foo'] }
    }
}
