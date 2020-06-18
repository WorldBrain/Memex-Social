export type User<WithPk extends boolean = true, Relationships extends null = null, ReverseRelationships extends 'emails' | 'rights' | null = null> =
    ( WithPk extends true ? { id : number | string } : {} ) &
    {
        isActive : boolean
        displayName? : string
        picture? : any
    } &
    ( 'emails' extends ReverseRelationships ? { emails : UserEmail[] } : {} ) &
    ( 'rights' extends ReverseRelationships ? { rights : UserRight[] } : {} )

export type UserEmail<WithPk extends boolean = true, Relationships extends 'user' | null = null> =
    ( WithPk extends true ? { id : number | string } : {} ) &
    {
        address : string
        isPrimary : boolean
        isActive : boolean
    } &
    {
        user : 'user' extends Relationships ? User : undefined
    }

export type UserRight<WithPk extends boolean = true, Relationships extends 'user' | null = null> =
    ( WithPk extends true ? { id : number | string } : {} ) &
    {
        canCreateProjects? : boolean
    } &
    {
        user : 'user' extends Relationships ? User : undefined
    }
