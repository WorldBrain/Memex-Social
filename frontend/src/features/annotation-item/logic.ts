import { ImageSupportInterface } from '@worldbrain/memex-common/lib/image-support/types'
import { UIElementServices } from '../../services/types'
import { StorageModules } from '../../storage/types'
import { Logic } from '../../utils/logic'
import { executeTask, TaskState } from '../../utils/tasks'
import { SharedAnnotation } from '@worldbrain/memex-common/lib/content-sharing/types'

export interface AnnotationItemDependencies {
    annotationId: string
    annotation: SharedAnnotation
    onClick: () => void
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
}

export type AnnotationItemState = {
    loadState: TaskState
    loadingReplies: TaskState
    isEditing: boolean
    isDeleting: boolean
    isHovering: boolean
    isSelected: boolean
    isRepliesExpanded: boolean
    isScreenshotAnnotation: boolean
}

export class AnnotationItemLogic extends Logic<
    AnnotationItemDependencies,
    AnnotationItemState
> {
    getInitialState = (): AnnotationItemState => ({
        loadState: 'pristine',
        loadingReplies: 'pristine',
        isEditing: false,
        isDeleting: false,
        isHovering: false,
        isSelected: false,
        isRepliesExpanded: false,
        isScreenshotAnnotation: false,
    })

    async initialize() {
        await executeTask(this, 'loadState', async () => {
            let isScreenshotAnnotation = false
            // if (this.deps.annotation.selector) {
            //     isScreenshotAnnotation =
            //         JSON.parse(this.deps.annotation.selector)?.dimensions !=
            //         null
            // }
        })
    }

    setCommentEditing = (isEditing: boolean) => {
        this.setState({ isEditing })
    }

    setIsDeleting = (isDeleting: boolean) => {
        this.setState({ isDeleting })
    }

    setIsHovering = (isHovering: boolean) => {
        this.setState({ isHovering })
    }

    toggleReplies = () => {
        this.setState({ isRepliesExpanded: !this.state.isRepliesExpanded })

        if (!this.state.isRepliesExpanded) {
            this.loadReplies()
        }
    }

    loadReplies = () => {
        this.setState({ loadingReplies: 'running' })
    }
}
