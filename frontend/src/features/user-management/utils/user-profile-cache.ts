import { StorageModules } from '../../../storage/types'
import {
    UserReference,
    User,
} from '@worldbrain/memex-common/lib/web-interface/types/users'

export default class UserProfileCache {
    users: { [id: string]: Promise<User | null> } = {}

    constructor(
        private dependencies: {
            storage: Pick<StorageModules, 'users'>
        },
    ) {}

    loadUser = async (userReference: UserReference): Promise<User | null> => {
        if (this.users[userReference.id]) {
            return this.users[userReference.id]
        }

        const user = this.dependencies.storage.users.getUser(userReference)
        this.users[userReference.id] = user
        return user
    }
}
