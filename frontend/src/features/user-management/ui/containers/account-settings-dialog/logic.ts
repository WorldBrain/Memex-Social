import { UILogic, UIEventHandler, loadInitial } from "../../../../../main-ui/classes/logic"
import { AccountSettingsEvent, AccountSettingsDependencies, AccountSettingsState } from "./types"

type EventHandler<EventName extends keyof AccountSettingsEvent> = UIEventHandler<AccountSettingsState, AccountSettingsEvent, EventName>

export default class AccountSettingsLogic extends UILogic<AccountSettingsState, AccountSettingsEvent> {
    constructor(private dependencies: AccountSettingsDependencies) {
        super()
    }

    getInitialState(): AccountSettingsState {
        return {
            loadState: 'pristine'
        }
    }

    init: EventHandler<'init'> = async () => {
        await loadInitial<AccountSettingsState>(this, async () => {
            this.emitMutation({
                displayName: { $set: (await this.dependencies.services.auth.getCurrentUser()?.displayName) }
            })
        })
    }
}
