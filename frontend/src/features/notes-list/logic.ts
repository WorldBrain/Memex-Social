import { ImageSupportInterface } from '@worldbrain/memex-common/lib/image-support/types'
import { UIElementServices } from '../../services/types'
import { StorageModules } from '../../storage/types'
import { Logic } from '../../utils/logic'
import { executeTask, TaskState } from '../../utils/tasks'
import { executeUITask } from '../../main-ui/classes/logic'
import { BlueskyList } from '@worldbrain/memex-common/lib/bsky/storage/types'
import { createPersonalCloudStorageUtils } from '@worldbrain/memex-common/lib/content-sharing/storage/utils'
import {
    SharedAnnotation,
    SharedAnnotationListEntry,
    SharedAnnotationReference,
    SharedList,
    SharedListReference,
    SharedListRole,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import { SharedListRoleID } from '@worldbrain/memex-common/lib/content-sharing/types'
import { UserReference } from '../user-management/types'
import { CollectionDetailsDeniedData } from '@worldbrain/memex-common/lib/content-sharing/backend/types'
import { CollectionDetailsListEntry } from '../content-sharing/ui/pages/collection-details/types'
import { UploadStorageUtils } from '@worldbrain/memex-common/lib/personal-cloud/backend/translation-layer/storage-utils'
import StorageManager from '@worldbrain/storex'
import { PAGE_SIZE } from '../content-sharing/ui/pages/collection-details/constants'
import { getInitialNewReplyState } from '../content-conversations/ui/utils'
import { UITaskState } from '../../main-ui/types'
import {
    GetAnnotationListEntriesElement,
    GetAnnotationListEntriesResult,
    GetAnnotationsResult,
} from '@worldbrain/memex-common/lib/content-sharing/storage/types'
import { PreparedThread } from '@worldbrain/memex-common/lib/content-conversations/storage/types'
import {
    detectAnnotationConversationThreads,
    intializeNewPageReplies,
} from '../content-conversations/ui/logic'
import { CreationInfoProps } from '@worldbrain/memex-common/lib/common-ui/components/creation-info'
import { NewReplyState } from '../content-conversations/ui/types'
import UserProfileCache from '../user-management/utils/user-profile-cache'
import {
    filterObject,
    mapValues,
} from '@worldbrain/memex-common/lib/utils/iteration'
import { AutoPk } from '../../types'

const LIST_DESCRIPTION_CHAR_LIMIT = 400

export interface NotesListDependencies {
    annotationEntries: GetAnnotationListEntriesElement[]
    url: string
    listID: AutoPk
    getRootElement: () => HTMLElement
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
}

export type NotesListState = {
    loadState: TaskState
    annotations: GetAnnotationsResult
}

export class NotesListLogic extends Logic<NotesListState> {
    constructor(public props: NotesListDependencies) {
        super()
    }

    getInitialState = (): NotesListState => ({
        loadState: 'pristine',
        annotations: {},
    })

    async initialize() {
        console.log('initialize')
        await executeTask(this, 'loadState', async () => {
            await this.loadAnnotations()
        })
    }

    loadAnnotations = async (
        url?: string,
        annotationEntries?: GetAnnotationListEntriesElement[],
    ) => {
        const entries = annotationEntries ?? this.props.annotationEntries
        if (!entries) {
            this.setState({ annotations: {} })
            return
        }
        const annotationIds = filterObject(
            mapValues({ [this.props.url]: entries }, (entries) =>
                entries.map((entry) => entry.sharedAnnotation.id),
            ),
            (_, key) => true,
        )
        const annotationsResult = await this.props.services.contentSharing.backend.loadAnnotationsWithThreads(
            {
                listId: this.props.listID.toString(),
                annotationIds: annotationIds,
            },
        )
        if (annotationsResult.status !== 'success') {
            return
        }
        const annotationsData = annotationsResult.data
        this.setState({ annotations: annotationsData.annotations })
    }

    getAnnotation(
        annotationEntry: SharedAnnotationListEntry & {
            sharedAnnotation: SharedAnnotationReference
        },
    ) {
        const { state } = this
        const annotationID = this.props.storage.contentSharing.getSharedAnnotationLinkID(
            annotationEntry.sharedAnnotation,
        )
        const annotation = state.annotations[annotationID]
        return annotation ?? null
    }

    // TODO:
    /*
    - load notes given an page identifier
    - create a note for a given page identifier
    - load replies to a note
    - create a reply to a note
    - delete a note
    - delete a reply to a note
    - edit a note
    - edit a reply to a note
    - hover states for notes and replies
    - reply delete states for notes and replies
    - reply edit states for notes and replies
    - conversation threads for notes and replies
    
    
    */
}
