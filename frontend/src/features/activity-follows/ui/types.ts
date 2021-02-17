import {
    SharedListReference,
    SharedList,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import { UITaskState } from '../../../main-ui/types'
import { UIEventHandler } from '../../../main-ui/classes/logic'

export interface ActivityFollowsState {
    followedLists: Array<SharedList & { reference: SharedListReference }>
    isListSidebarShown: boolean
    listSidebarLoadState: UITaskState
}

export interface ActivityFollowsEvent {
    initActivityFollows: undefined
}

export type ActivityFollowsHandlers = {
    [EventName in keyof ActivityFollowsEvent]: UIEventHandler<
        ActivityFollowsState,
        ActivityFollowsEvent,
        EventName
    >
}
