import { CreationInfoProps } from '@worldbrain/memex-common/lib/common-ui/components/creation-info'
import { StorageModules } from '../../../storage/types'
import {
    UserReference,
    User,
} from '@worldbrain/memex-common/lib/web-interface/types/users'

export default class UserProfileCache {
    users: {
        [id: string]: CreationInfoProps['creatorInfo']
    } = {}

    constructor(
        private dependencies: {
            storage: Pick<StorageModules, 'users' | 'bluesky'>
            onUsersLoad?(users: {
                [id: string]: CreationInfoProps['creatorInfo'] | null
            }): void
        },
    ) {}

    loadUser = async (
        userReference: UserReference,
        skipCb?: boolean,
        loadSocialAccounts?: boolean,
    ): Promise<CreationInfoProps['creatorInfo'] | null> => {
        if (userReference.id === 'memex-bluesky-bot-id') {
            this.users[userReference.id] = {
                displayName: 'Memex Bluesky Bot',
                profileImageUrl: undefined,
                platforms: [],
            }
            return this.users[userReference.id]
        }
        if (this.users[userReference.id]) {
            return this.users[userReference.id]
        }

        const user = await this.dependencies.storage.users.getUser(
            userReference,
        )

        if (!user || !user.displayName) {
            return null
        }
        this.users[userReference.id] = {
            displayName: user.displayName,
            profileImageUrl: undefined,
            platforms: [],
        }
        if (loadSocialAccounts) {
            try {
                const blueskyUser = await this.dependencies.storage.bluesky.findBlueskyUsersByUserReferences(
                    {
                        users: [userReference],
                    },
                )

                this.users[userReference.id] = {
                    displayName: user.displayName,
                    profileImageUrl: blueskyUser[userReference.id]?.avatar,
                    platforms: blueskyUser[userReference.id]
                        ? [
                              {
                                  id: blueskyUser[userReference.id].did,
                                  platform: 'bluesky',
                                  handle: blueskyUser[userReference.id].handle,
                              },
                          ]
                        : [],
                }
            } catch (e) {
                console.error('Error loading Bluesky user', e)
            }
        }

        if (!skipCb) {
            this.dependencies.onUsersLoad?.({
                [userReference.id]: this.users[userReference.id],
            })
        }

        return this.users[userReference.id]
    }

    loadUsers = async (
        userReferences: Array<UserReference>,
        loadSocialAccounts: boolean,
    ): Promise<{ [id: string]: CreationInfoProps['creatorInfo'] }> => {
        const users: {
            [id: string]: CreationInfoProps['creatorInfo']
        } = {}
        await Promise.all(
            userReferences.map(async (userReference) => {
                const userData = await this.loadUser(
                    userReference,
                    true,
                    loadSocialAccounts,
                )
                if (userData) {
                    users[userReference.id] = userData
                }
            }),
        )
        this.dependencies.onUsersLoad?.(users)
        return users
    }
}
