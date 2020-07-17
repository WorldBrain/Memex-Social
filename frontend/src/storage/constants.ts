export type AccountCollectionInfoMap = { [collection: string]: AccountCollectionInfo }
export interface AccountCollectionInfo {
    onAccountDelete: 'delete' | 'ignore'
}

export const ACCOUNT_COLLECTIONS: AccountCollectionInfoMap = {
    userEmail: {
        onAccountDelete: 'delete',
    },
    userRight: {
        onAccountDelete: 'delete',
    },
    projectSubscription: {
        onAccountDelete: 'delete',
    },
    projectSubscriptionConfiguration: {
        onAccountDelete: 'delete',
    },
    projectMembership: {
        onAccountDelete: 'delete',
    },
    sharedList: {
        onAccountDelete: 'delete',
    },
    sharedListEntry: {
        onAccountDelete: 'delete',
    },
}
