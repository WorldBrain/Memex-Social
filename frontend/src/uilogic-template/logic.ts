import { ImageSupportInterface } from '@worldbrain/memex-common/lib/image-support/types'
import { UIElementServices } from '../services/types'
import { StorageModules } from '../storage/types'
import { Logic } from '../utils/logic'
import { executeTask, TaskState } from '../utils/tasks'
import { executeUITask } from '../main-ui/classes/logic'
import { BlueskyList } from '@worldbrain/memex-common/lib/bsky/storage/types'
import { createPersonalCloudStorageUtils } from '@worldbrain/memex-common/lib/content-sharing/storage/utils'
import {
    SharedList,
    SharedListReference,
    SharedListRole,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import { SharedListRoleID } from '@worldbrain/memex-common/lib/content-sharing/types'
import { UserReference } from '../features/user-management/types'
import { CollectionDetailsDeniedData } from '@worldbrain/memex-common/lib/content-sharing/backend/types'
import { CollectionDetailsListEntry } from '../features/content-sharing/ui/pages/collection-details/types'
import { UploadStorageUtils } from '@worldbrain/memex-common/lib/personal-cloud/backend/translation-layer/storage-utils'
import StorageManager from '@worldbrain/storex'
import { PAGE_SIZE } from '../features/content-sharing/ui/pages/collection-details/constants'
import { getInitialNewReplyState } from '../features/content-conversations/ui/utils'
import { UITaskState } from '../main-ui/types'
import {
    GetAnnotationListEntriesResult,
    GetAnnotationsResult,
} from '@worldbrain/memex-common/lib/content-sharing/storage/types'
import { PreparedThread } from '@worldbrain/memex-common/lib/content-conversations/storage/types'
import {
    detectAnnotationConversationThreads,
    intializeNewPageReplies,
} from '../features/content-conversations/ui/logic'
import { CreationInfoProps } from '@worldbrain/memex-common/lib/common-ui/components/creation-info'
import { NewReplyState } from '../features/content-conversations/ui/types'
import UserProfileCache from '../features/user-management/utils/user-profile-cache'

const LIST_DESCRIPTION_CHAR_LIMIT = 400

export interface NotesSidebarDependencies {
    services: UIElementServices<
        | 'auth'
        | 'bluesky'
        | 'overlay'
        | 'listKeys'
        | 'contentSharing'
        | 'contentConversations'
        | 'activityStreams'
        | 'router'
        | 'activityStreams'
        | 'documentTitle'
        | 'userManagement'
        | 'localStorage'
        | 'clipboard'
        | 'userMessages'
        | 'youtube'
        | 'memexExtension'
        | 'summarization'
        | 'fullTextSearch'
    >
    storage: Pick<
        StorageModules,
        | 'contentSharing'
        | 'contentConversations'
        | 'users'
        | 'bluesky'
        | 'slack'
        | 'slackRetroSync'
        | 'discord'
        | 'discordRetroSync'
        | 'activityStreams'
        | 'activityFollows'
    >
    imageSupport: ImageSupportInterface
    getRootElement: () => HTMLElement
    storageManager: StorageManager
}

export type NotesSidebarState = {
    loadState: TaskState
}

export class NotesSidebarLogic extends Logic<NotesSidebarState> {
    private personalCloudStorageUtils: UploadStorageUtils | null = null
    private _users: UserProfileCache

    constructor(public deps: NotesSidebarDependencies) {
        super()

        this._users = new UserProfileCache({
            ...deps,
            onUsersLoad: (users) => {
                this.setState({ users })
            },
        })
    }

    getInitialState = (): NotesSidebarState => ({
        loadState: 'pristine',
    })

    async initialize() {
        await executeTask(this, 'loadState', async () => {})
    }
}
