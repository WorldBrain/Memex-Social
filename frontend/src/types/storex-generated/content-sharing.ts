export type SharedList =
    {
        createdWhen: number
        updatedWhen: number
        title: string
    }

export type SharedListEntry =
    {
        createdWhen: number
        updatedWhen: number
        entryTitle: string
        normalizedUrl: string
        originalUrl: string
    }
