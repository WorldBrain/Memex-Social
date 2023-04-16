import type { ProcessSharedListKeyResult } from '@worldbrain/memex-common/lib/content-sharing/service/types'
import {
    GetAnnotationListEntriesResult,
    GetAnnotationsResult,
} from '@worldbrain/memex-common/lib/content-sharing/storage/types'
import {
    SharedList,
    SharedListReference,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'
import { User } from '@worldbrain/memex-common/lib/web-interface/types/users'
import { UIEvent } from '../../../main-ui/classes/logic'
import { UIElementServices } from '../../../services/types'
import { StorageModules } from '../../../storage/types'
import {
    AnnotationConversationEvent,
    AnnotationConversationsState,
} from '../../content-conversations/ui/types'
import { CollectionDetailsListEntry } from '../../content-sharing/ui/pages/collection-details/types'
import { UserReference } from '../../user-management/types'

export interface ReaderPageViewDependencies {
    services: UIElementServices<
        | 'auth'
        | 'contentConversations'
        | 'userMessages'
        | 'listKeys'
        | 'router'
        | 'overlay'
        | 'userManagement'
    >
    storage: Pick<
        StorageModules,
        'contentSharing' | 'contentConversations' | 'users'
    >
    listID: string
    entryID: string
}

export type ReaderPageViewState = AnnotationConversationsState & {
    users: { [id: string]: Pick<User, 'displayName' | 'platform'> }
    listLoadState: UITaskState
    listData?: {
        reference: SharedListReference
        creatorReference: UserReference
        creator?: Pick<User, 'displayName'> | null
        list: SharedList
        entry: CollectionDetailsListEntry
        title: string
        url: string
    }
    annotationEntriesLoadState: UITaskState
    annotationLoadStates: { [normalizedPageUrl: string]: UITaskState }
    annotationEntryData?: GetAnnotationListEntriesResult
    annotations: GetAnnotationsResult
    sidebarWidth: number
    isYoutubeVideo: boolean
    reportURLSuccess: boolean
    showInstallTooltip: boolean
    collaborationKey: string | null
    collaborationKeyLoadState: UITaskState
    joinListState: UITaskState
    joinListResult: ProcessSharedListKeyResult | null
    showShareMenu: boolean
    linkCopiedToClipBoard: boolean
    iframeLoadState: UITaskState
}

export type ReaderPageViewEvent = UIEvent<AnnotationConversationEvent> & {
    setReaderContainerRef: { ref: HTMLDivElement | null }
    setSidebarWidth: { width: number }
    reportUrl: { url: string }
    copyLink: { url: string | null }
    closeInstallTooltip: null
    showSharePageMenu: null
    installMemexClick: {
        sharedListReference: SharedListReference
        urlToOpen: string
    }
}
