import { UILogic, UIEvent, loadInitial } from "../../classes/logic"
import { Storage } from "../../../storage/types";
import { Services } from "../../../services/types";
import { UITaskState } from "../../types";

export interface State {
    loadState: UITaskState
}
export type Event = UIEvent<{
}>

export default class Logic extends UILogic<State, Event> {
    constructor(private options: { services: Pick<Services, 'auth' | 'router'>, storage: Storage }) {
        super()
    }

    getInitialState(): State {
        return {
            loadState: 'pristine',
        }
    }

    async processInit() {
        await loadInitial<State>(this, async () => {
            const user = this.options.services.auth.getCurrentUser()
            if (!user) {
                throw new Error(`Tried to access user home page without logged in user`)
            }
        })
    }
}
