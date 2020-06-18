export type Project<WithPk extends boolean = true, Relationships extends null = null, ReverseRelationships extends 'postTags' | null = null> =
    ( WithPk extends true ? { id : number | string } : {} ) &
    {
        name : string
        slug : string
        shortDescription : string
    } &
    ( 'postTags' extends ReverseRelationships ? { postTags : ProjectPost[] } : {} )

export type AvailableProjectPostTag<WithPk extends boolean = true, Relationships extends 'project' | null = null> =
    ( WithPk extends true ? { id : number | string } : {} ) &
    {
        label : string
    } &
    {
        project : 'project' extends Relationships ? Project : undefined
    }

export type ProjectPost<WithPk extends boolean = true, Relationships extends 'project' | null = null> =
    ( WithPk extends true ? { id : number | string } : {} ) &
    {
        title : string
        shortDescription : string
    } &
    {
        project : 'project' extends Relationships ? Project : undefined
    }

export type ProjectPostTag<WithPk extends boolean = true, Relationships extends null = null> =
    ( WithPk extends true ? { id : number | string } : {} )

export type ProjectMembership<WithPk extends boolean = true, Relationships extends null = null> =
    ( WithPk extends true ? { id : number | string } : {} ) &
    {
        role : number
    }
