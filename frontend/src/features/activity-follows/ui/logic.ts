import { ActivityFollowsState, ActivityFollowsEvent, ActivityFollowsHandlers } from './types'
import { UILogic, executeUITask } from "../../../main-ui/classes/logic";
import { Services } from '../../../services/types';
import ActivityFollowsStorage from '../storage';
import ContentSharingStorage from '../../content-sharing/storage';

export function activityFollowsInitialState(): ActivityFollowsState {
    return {
        followedLists: [],
        isListSidebarShown: false,
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

    }
): ActivityFollowsHandlers {
    return {
        initActivityFollows: async () => {
            const { activityFollows, contentSharing } = dependencies.storage
            const { auth } = dependencies.services

            const userReference = auth.getCurrentUserReference()

            if (userReference == null) {
                return
            }

            await executeUITask<ActivityFollowsState>(logic, 'listSidebarLoadState', async () => {
                const follows = await activityFollows.getAllFollowsByCollection({
                    collection: 'sharedList', userReference,
                })

                const followedLists: ActivityFollowsState['followedLists'] = []
                const seenLists = new Set()

                for (const { objectId } of follows) {
                    if (seenLists.has(objectId)) {
                        continue
                    }
                    seenLists.add(objectId)

                    followedLists.push(await contentSharing.getListByReference({
                        id: objectId,
                        type: 'shared-list-reference',
                    }))
                }

                logic.emitMutation({
                    followedLists: { $set: followedLists },
                    isListSidebarShown: { $set: true },
                })
            })
        }
    }
}
