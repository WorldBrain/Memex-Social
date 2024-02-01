import { UILogic, UIMutation } from '../../classes/logic'
import type { LandingPageEvent, LandingPageDependencies } from './types'

export interface LandingPageState {
    foo: boolean
}
export default class LandingPageLogic extends UILogic<
    LandingPageState,
    LandingPageEvent
> {
    constructor(private dependencies: LandingPageDependencies) {
        super()
    }

    getInitialState() {
        return { foo: false }
    }

    toggle(): UIMutation<LandingPageState> {
        return { $toggle: ['foo'] }
    }
}
