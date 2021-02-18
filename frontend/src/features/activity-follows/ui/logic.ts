import {
    ActivityFollowsState,
    ActivityFollowsEvent,
    ActivityFollowsHandlers,
} from './types'
import { UILogic, executeUITask } from '../../../main-ui/classes/logic'
import { Services } from '../../../services/types'
import ActivityFollowsStorage from '../storage'
import ContentSharingStorage from '../../content-sharing/storage'
import { SharedListReference } from '@worldbrain/memex-common/lib/content-sharing/types'

export function activityFollowsInitialState(): ActivityFollowsState {
    return {
        followedLists: [],
        isListSidebarShown: false,
        onListSidebarToggle: () => {},
        listSidebarLoadState: 'pristine',
    }
}

export function activityFollowsEventHandlers(
    logic: UILogic<ActivityFollowsState, ActivityFollowsEvent>,
    dependencies: {
        services: Pick<Services, 'auth'>
        storage: {
            activityFollows: ActivityFollowsStorage
            contentSharing: ContentSharingStorage
        }
    },
): ActivityFollowsHandlers {
    return {
        initActivityFollows: async () => {
            const { activityFollows, contentSharing } = dependencies.storage
            const { auth } = dependencies.services

            const userReference = auth.getCurrentUserReference()

            if (userReference == null) {
                return
            }

            await executeUITask<ActivityFollowsState>(
                logic,
                'listSidebarLoadState',
                async () => {
                    const follows = await activityFollows.getAllFollowsByCollection(
                        {
                            collection: 'sharedList',
                            userReference,
                        },
                    )

                    const listReferences: SharedListReference[] = []
                    const seenLists = new Set()

                    for (const { objectId } of follows) {
                        if (seenLists.has(objectId)) {
                            continue
                        }
                        seenLists.add(objectId)

                        listReferences.push({
                            id: objectId,
                            type: 'shared-list-reference',
                        })
                    }

                    const followedLists = listReferences.length
                        ? await contentSharing.getListsByReferences(
                              listReferences,
                          )
                        : []

                    logic.emitMutation({
                        followedLists: { $set: followedLists },
                        isListSidebarShown: { $set: true },
                        onListSidebarToggle: (newShownValue: boolean) => logic.emitMutation({
                            isListSidebarShown: { $set: newShownValue }
                        })
                    })
                },
            )
        },
    }
}
