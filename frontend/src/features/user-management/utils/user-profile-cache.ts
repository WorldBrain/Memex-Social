import { StorageModules } from '../../../storage/types'
import {
    UserReference,
    User,
} from '@worldbrain/memex-common/lib/web-interface/types/users'

export default class UserProfileCache {
    users: { [id: string | number]: Promise<User | null> } = {}

    constructor(
        private dependencies: {
            storage: Pick<StorageModules, 'users'>
            onUsersLoad?(users: { [id: string]: User | null }): void
        },
    ) {}

    loadUser = async (
        userReference: UserReference,
        skipCb?: boolean,
    ): Promise<User | null> => {
        if (await this.users[userReference.id]) {
            return this.users[userReference.id]
        }

        const user = this.dependencies.storage.users.getUser(userReference)
        this.users[userReference.id] = user
        const userData = await user
        if (!skipCb) {
            this.dependencies.onUsersLoad?.({ [userReference.id]: userData })
        }
        return user
    }

    loadUsers = async (
        userReferences: Array<UserReference>,
    ): Promise<{ [id: string]: User | null }> => {
        const users: { [id: string]: User | null } = {}
        await Promise.all(
            userReferences.map(async (userReference) => {
                users[userReference.id] = await this.loadUser(
                    userReference,
                    true,
                )
            }),
        )
        this.dependencies.onUsersLoad?.(users)
        return users
    }
}
