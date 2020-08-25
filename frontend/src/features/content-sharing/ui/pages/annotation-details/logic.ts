import { AnnotationDetailsEvent, AnnotationDetailsDependencies } from "./types"
import { UILogic, UIEventHandler, executeUITask } from "../../../../../main-ui/classes/logic"
import { UITaskState } from "../../../../../main-ui/types"

export interface AnnotationDetailsState {
    userLoadState: UITaskState
    annotationLoadState: UITaskState
    pageEntryLoadState: UITaskState
}
type EventHandler<EventName extends keyof AnnotationDetailsEvent> = UIEventHandler<AnnotationDetailsState, AnnotationDetailsEvent, EventName>

export default class AnnotationDetailsLogic extends UILogic<AnnotationDetailsState, AnnotationDetailsEvent> {
    pageAnnotationPromises: { [normalizedPageUrl: string]: Promise<void> } = {}
    latestPageSeenIndex = 0

    constructor(private dependencies: AnnotationDetailsDependencies) {
        super()
    }

    getInitialState(): AnnotationDetailsState {
        return {
            userLoadState: 'pristine',
            annotationLoadState: 'pristine',
            pageEntryLoadState: 'pristine',
        }
    }

    init: EventHandler<'init'> = async () => {
        // const { contentSharing, userManagement } = this.dependencies
        await executeUITask<AnnotationDetailsState>(this, 'annotationLoadState', async () => {
        })
        await Promise.all([
            executeUITask<AnnotationDetailsState>(this, 'pageEntryLoadState', async () => {
            }),
            executeUITask<AnnotationDetailsState>(this, 'annotationLoadState', async () => {
            })
        ])
    }
}
