import { ImageSupportInterface } from '@worldbrain/memex-common/lib/image-support/types'
import { UIElementServices } from '../../services/types'
import { StorageModules } from '../../storage/types'
import { Logic } from '../../utils/logic'
import { executeTask, TaskState } from '../../utils/tasks'
import {
    SharedAnnotation,
    SharedAnnotationListEntry,
    SharedAnnotationReference,
    SharedListEntry,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import { AutoPk } from '../../types'
import { AiChatReference } from '@worldbrain/memex-common/lib/ai-chat/service/types'
import { GetAnnotationsResult } from '@worldbrain/memex-common/lib/content-sharing/storage/types'

const LIST_DESCRIPTION_CHAR_LIMIT = 400

export interface ReferencesListDependencies {
    reference: AiChatReference
    listID: AutoPk
    getRootElement: () => HTMLElement
    services: UIElementServices<
        | 'auth'
        | 'bluesky'
        | 'overlay'
        | 'events'
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

export type ReferencesListState = {
    loadState: TaskState
    annotations: { [id: string]: SharedAnnotation }
    pages: SharedListEntry[]
    type: 'annotation' | 'page' | null
}

export class ReferencesListLogic extends Logic<
    ReferencesListDependencies,
    ReferencesListState
> {
    getInitialState = (): ReferencesListState => ({
        loadState: 'pristine',
        type: null,
        annotations: {},
        pages: [],
    })

    async initialize() {
        await executeTask(this, 'loadState', async () => {
            await this.loadReferences(this.deps.reference)
        })
    }

    loadReferences = async (reference?: AiChatReference) => {
        await executeTask(this, 'loadState', async () => {
            if (!reference) {
                return
            }

            if (reference.type === 'annotation') {
                const annotationResult = await this.deps.storage.contentSharing.getAnnotation(
                    {
                        reference: {
                            type: 'shared-annotation-reference',
                            id: reference.id,
                        },
                    },
                )
                const annotationData = annotationResult?.annotation
                if (!annotationData) {
                    return
                }
                this.setState({
                    type: 'annotation',
                    annotations: {
                        [this.deps.reference.id]: annotationData,
                    },
                })
            } else if (reference.type === 'page') {
                const page = await this.deps.storage.contentSharing.getListEntryByReference(
                    {
                        type: 'shared-list-entry-reference',
                        id: reference.id,
                    },
                )
            }
        })
    }

    getAnnotation(
        annotationEntry: SharedAnnotationListEntry & {
            sharedAnnotation: SharedAnnotationReference
        },
    ) {
        const { state } = this
        const annotationID = this.deps.storage.contentSharing.getSharedAnnotationLinkID(
            annotationEntry.sharedAnnotation,
        )
        const annotation = state.annotations[annotationID]
        return annotation ?? null
    }

    onNoteClick = (annotationId: string) => {
        return null
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
