import { SharedList, SharedListReference } from "@worldbrain/memex-common/lib/content-sharing/types"
import { UIEvent } from "../../classes/logic"
import { UITaskState } from "../../types"
import { Storage } from "../../../storage/types"
import { UIElementServices } from "../../classes"

export interface Dependencies {
    services: UIElementServices<'router' | 'auth'>
    storage: Pick<Storage, 'serverModules'>
}

export interface State {
    sharedLists: Array<SharedList & { reference: SharedListReference }>
    isListShown: boolean
    loadState: UITaskState
}

export type Events = UIEvent<{
    clickSharedList: { listRef: SharedListReference }
}>
