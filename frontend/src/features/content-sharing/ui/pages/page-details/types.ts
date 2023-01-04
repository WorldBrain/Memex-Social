import {
    SharedAnnotationReference,
    SharedAnnotation,
    SharedPageInfoReference,
    SharedPageInfo,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import UserStorage from '../../../../user-management/storage'
import { UIEvent, UISignal } from '../../../../../main-ui/classes/logic'
import { UIElementServices } from '../../../../../services/types'
import {
    AnnotationConversationEvent,
    AnnotationConversationsState,
    AnnotationConversationSignal,
} from '../../../../content-conversations/ui/types'
import { UITaskState } from '../../../../../main-ui/types'
import {
    User,
    UserReference,
} from '@worldbrain/memex-common/lib/web-interface/types/users'
import { StorageModules } from '../../../../../storage/types'
import {
    ListsSidebarState,
    ListsSidebarEvent,
} from '../../../../lists-sidebar/ui/types'
import type {
    ExtDetectionState,
    ExtDetectionEvent,
} from '../../../../ext-detection/ui/logic'

export interface PageDetailsDependencies {
    services: UIElementServices<
        | 'contentConversations'
        | 'auth'
        | 'overlay'
        | 'activityStreams'
        | 'router'
        | 'userManagement'
        | 'webMonetization'
        | 'localStorage'
        | 'documentTitle'
        | 'userMessages'
        | 'memexExtension'
    >
    storage: Pick<
        StorageModules,
        | 'contentSharing'
        | 'contentConversations'
        | 'users'
        | 'activityStreams'
        | 'activityFollows'
    >
    pageID: string
    userManagement: UserStorage
}

export type PageDetailsState = AnnotationConversationsState &
    ListsSidebarState &
    ExtDetectionState & {
        annotationLoadState: UITaskState
        annotations?: Array<
            SharedAnnotation & {
                reference: SharedAnnotationReference
                linkId: string
            }
        > | null

        pageInfoLoadState: UITaskState
        pageInfoReference?: SharedPageInfoReference | null
        pageInfo?: SharedPageInfo | null

        creatorLoadState: UITaskState
        creator?: User | null
        creatorReference?: UserReference | null
    }

export type PageDetailsEvent = UIEvent<
    AnnotationConversationEvent & ListsSidebarEvent & ExtDetectionEvent
>

export type PageDetailsSignal = UISignal<
    { type: 'loaded' } | AnnotationConversationSignal
>
