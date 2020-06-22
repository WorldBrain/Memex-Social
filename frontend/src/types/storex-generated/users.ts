export type User =
    {
        isActive: boolean
        displayName?: string
        picture?: any
    }

export type UserEmail =
    {
        address: string
        isPrimary: boolean
        isActive: boolean
    }
