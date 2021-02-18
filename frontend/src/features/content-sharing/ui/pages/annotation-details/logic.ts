import {
    User,
    UserReference,
} from '@worldbrain/memex-common/lib/web-interface/types/users'
import {
    SharedAnnotation,
    SharedPageInfo,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import {
    UILogic,
    UIEventHandler,
    executeUITask,
} from '../../../../../main-ui/classes/logic'
import { UITaskState } from '../../../../../main-ui/types'
import { AnnotationDetailsEvent, AnnotationDetailsDependencies } from './types'

export interface AnnotationDetailsState {
    annotationLoadState: UITaskState
    annotation?: SharedAnnotation | null

    pageInfoLoadState: UITaskState
    pageInfo?: SharedPageInfo | null

    creatorLoadState: UITaskState
    creator?: User | null
}
type EventHandler<
    EventName extends keyof AnnotationDetailsEvent
> = UIEventHandler<AnnotationDetailsState, AnnotationDetailsEvent, EventName>

export default class AnnotationDetailsLogic extends UILogic<
    AnnotationDetailsState,
    AnnotationDetailsEvent
> {
    constructor(private dependencies: AnnotationDetailsDependencies) {
        super()
    }

    getInitialState(): AnnotationDetailsState {
        return {
            creatorLoadState: 'pristine',
            annotationLoadState: 'pristine',
            pageInfoLoadState: 'pristine',
        }
    }

    init: EventHandler<'init'> = async () => {
        const { contentSharing, users } = this.dependencies.storage
        const annotationReference = contentSharing.getSharedAnnotationReferenceFromLinkID(
            this.dependencies.annotationID,
        )
        let annotation: SharedAnnotation | null
        let creatorReference: UserReference | null
        await executeUITask<AnnotationDetailsState>(
            this,
            'annotationLoadState',
            async () => {
                const result = await contentSharing.getAnnotation({
                    reference: annotationReference,
                })
                annotation = result?.annotation ?? null
                creatorReference = result?.creatorReference ?? null

                return {
                    mutation: {
                        annotation: { $set: annotation },
                    },
                }
            },
        )
        await Promise.all([
            executeUITask<AnnotationDetailsState>(
                this,
                'pageInfoLoadState',
                async () => {
                    if (!annotation || !creatorReference) {
                        return
                    }

                    const result = await contentSharing.getPageInfoByCreatorAndUrl(
                        {
                            creatorReference,
                            normalizedUrl: annotation.normalizedPageUrl,
                        },
                    )
                    return {
                        mutation: {
                            pageInfo: {
                                $set: result?.pageInfo,
                            },
                        },
                    }
                },
            ),
            executeUITask<AnnotationDetailsState>(
                this,
                'creatorLoadState',
                async () => {
                    if (!creatorReference) {
                        return
                    }

                    return {
                        mutation: {
                            creator: {
                                $set: await users.getUser(creatorReference),
                            },
                        },
                    }
                },
            ),
        ])
    }
}
