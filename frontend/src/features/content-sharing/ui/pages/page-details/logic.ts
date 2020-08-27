import { User, UserReference } from "@worldbrain/memex-common/lib/web-interface/types/users"
import { SharedAnnotation, SharedPageInfo } from "@worldbrain/memex-common/lib/content-sharing/types"
import { UILogic, UIEventHandler, executeUITask } from "../../../../../main-ui/classes/logic"
import { UITaskState } from "../../../../../main-ui/types"
import { PageDetailsEvent, PageDetailsDependencies } from "./types"

export interface PageDetailsState {
    annotationLoadState: UITaskState
    annotations?: SharedAnnotation[] | null

    pageInfoLoadState: UITaskState
    pageInfo?: SharedPageInfo | null

    creatorLoadState: UITaskState
    creator?: User | null
}
type EventHandler<EventName extends keyof PageDetailsEvent> = UIEventHandler<PageDetailsState, PageDetailsEvent, EventName>

export default class PageDetailsLogic extends UILogic<PageDetailsState, PageDetailsEvent> {
    constructor(private dependencies: PageDetailsDependencies) {
        super()
    }

    getInitialState(): PageDetailsState {
        return {
            creatorLoadState: 'pristine',
            annotationLoadState: 'pristine',
            pageInfoLoadState: 'pristine',
        }
    }

    init: EventHandler<'init'> = async () => {
        const { contentSharing, userManagement } = this.dependencies
        const pageInfoReference = contentSharing.getSharedPageInfoReferenceFromLinkID(this.dependencies.pageID)
        let creatorReference: UserReference | null
        let pageInfo: SharedPageInfo | null
        await executeUITask<PageDetailsState>(this, 'pageInfoLoadState', async () => {
            const result = await contentSharing.getPageInfo(pageInfoReference)
            creatorReference = result?.creatorReference ?? null
            pageInfo = result?.pageInfo ?? null

            return {
                mutation: {
                    pageInfo: { $set: pageInfo }
                }
            }
        })
        await Promise.all([
            executeUITask<PageDetailsState>(this, 'annotationLoadState', async () => {
                if (!creatorReference || !pageInfo) {
                    return
                }

                return {
                    mutation: {
                        annotations: {
                            $set: await contentSharing.getAnnotationsByCreatorAndPageUrl({
                                creatorReference,
                                normalizedPageUrl: pageInfo.normalizedUrl,
                            })
                        }
                    }
                }
            }),
            executeUITask<PageDetailsState>(this, 'creatorLoadState', async () => {
                if (!creatorReference) {
                    return
                }

                return {
                    mutation: {
                        creator: {
                            $set: await userManagement.getUser(creatorReference),
                        }
                    }
                }
            })
        ])
    }
}
