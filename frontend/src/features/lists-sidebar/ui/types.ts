import {
    SharedListReference,
    SharedList as SharedListBase,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import { UITaskState } from '../../../main-ui/types'
import { UIEventHandler } from '../../../main-ui/classes/logic'

type SharedList = SharedListBase & { reference: SharedListReference }
export interface ListsSidebarState {
    isListSidebarShown: boolean
    followedLists: SharedList[]
    collaborativeLists: SharedList[]
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
