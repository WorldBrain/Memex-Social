import {
    SharedListReference,
    SharedList,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import { UITaskState } from '../../../main-ui/types'
import { UIEventHandler } from '../../../main-ui/classes/logic'

export interface ListsSidebarState {
    followedLists: Array<SharedList & { reference: SharedListReference }>
    isListSidebarShown: boolean
    listSidebarLoadState: UITaskState
}

export interface ListsSidebarEvent {
    initActivityFollows: undefined
    toggleListSidebar: undefined
}

export type ListsSidebarHandlers = {
    [EventName in keyof ListsSidebarEvent]: UIEventHandler<
        ListsSidebarState,
        ListsSidebarEvent,
        EventName
    >
}
