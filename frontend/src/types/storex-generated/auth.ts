export type AuthPostAuthAction<WithPk extends boolean = true> =
    ( WithPk extends true ? { id : number | string } : {} ) &
    {
        createdWhen : number
        data : string
    }
