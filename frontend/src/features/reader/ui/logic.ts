import {
    UILogic,
    UIEventHandler,
    executeUITask,
} from '../../../main-ui/classes/logic'
import { ReaderPageViewEvent, ReaderPageViewState } from './types'

export class ReaderPageViewLogic extends UILogic<
    ReaderPageViewState,
    ReaderPageViewEvent
> {
    getInitialState(): ReaderPageViewState {
        return {}
    }
}
