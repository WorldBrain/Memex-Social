import { UIEvent, UISignal } from "../../../../../main-ui/classes/logic";
import { UIElementServices } from "../../../../../main-ui/classes";
import { StorageModules } from "../../../../../storage/types";
import { UITaskState } from "../../../../../main-ui/types";

export interface AccountSettingsDependencies {
    services: UIElementServices<'auth' | 'overlay'>
    storage: Pick<StorageModules, 'users'>
    onCloseRequested(): void
}

export interface AccountSettingsState {
    loadState: UITaskState
    displayName?: string
}

export type AccountSettingsEvent = UIEvent<{
}>

export type AccountSettingsSignal = UISignal<
    { type: 'nothing-yet' }
>