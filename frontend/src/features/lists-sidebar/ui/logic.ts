import {
    ListsSidebarState,
    ListsSidebarEvent,
    ListsSidebarHandlers,
} from './types'
import { UILogic, executeUITask } from '../../../main-ui/classes/logic'
import { Services } from '../../../services/types'
import { SharedListReference } from '@worldbrain/memex-common/lib/content-sharing/types'
import { LOCAL_STORAGE_KEYS } from '../../../constants'
import { LocalStorageService } from '../../../services/local-storage/types'
import { StorageModules } from '../../../storage/types'

export const listsSidebarInitialState = (): ListsSidebarState => ({
    followedLists: [],
    collaborativeLists: [],
    isListSidebarShown: false,
    listSidebarLoadState: 'pristine',
})

export const listsSidebarEventHandlers = (
    logic: UILogic<ListsSidebarState, ListsSidebarEvent>,
    dependencies: {
        localStorage: LocalStorageService
        services: Pick<Services, 'auth'>
        storage: Pick<StorageModules, 'activityFollows' | 'contentSharing'>
    },
): ListsSidebarHandlers => ({
    initActivityFollows: async () => {
        const { activityFollows, contentSharing } = dependencies.storage
        const { auth } = dependencies.services

        const userReference = auth.getCurrentUserReference()

        if (userReference == null) {
            return
        }

        const isListSidebarShown =
            (dependencies.localStorage.getItem(
                LOCAL_STORAGE_KEYS.isListSidebarShown,
            ) ?? 'true') === 'true'

        await executeUITask<ListsSidebarState>(
            logic,
            'listSidebarLoadState',
            async () => {
                const follows = await activityFollows.getAllFollowsByCollection(
                    {
                        collection: 'sharedList',
                        userReference,
                    },
                )

                const listRoles = await contentSharing.getUserListRoles({
                    userReference,
                })

                const followedListReferences: SharedListReference[] = []
                const collaborativeListReferences: SharedListReference[] = []
                const seenLists = new Set()

                for (const { objectId } of follows) {
                    if (seenLists.has(objectId)) {
                        continue
                    }
                    seenLists.add(objectId)

                    followedListReferences.push({
                        id: objectId,
                        type: 'shared-list-reference',
                    })
                }

                for (const { sharedList } of listRoles) {
                    if (seenLists.has(sharedList.id)) {
                        continue
                    }
                    seenLists.add(sharedList.id)

                    collaborativeListReferences.push({
                        id: sharedList.id,
                        type: 'shared-list-reference',
                    })
                }

                const followedLists = followedListReferences.length
                    ? await contentSharing.getListsByReferences(
                          followedListReferences,
                      )
                    : []
                const collaborativeLists = collaborativeListReferences.length
                    ? await contentSharing.getListsByReferences(
                          collaborativeListReferences,
                      )
                    : []

                logic.emitMutation({
                    followedLists: { $set: followedLists },
                    collaborativeLists: { $set: collaborativeLists },
                    isListSidebarShown: { $set: isListSidebarShown },
                })
            },
        )
    },
    toggleListSidebar: ({ previousState }) => {
        const nextState = !previousState.isListSidebarShown

        dependencies.localStorage.setItem(
            LOCAL_STORAGE_KEYS.isListSidebarShown,
            nextState.toString(),
        )
        logic.emitMutation({ isListSidebarShown: { $set: nextState } })
    },
})
