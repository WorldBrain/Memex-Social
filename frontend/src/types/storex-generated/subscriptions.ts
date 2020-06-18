export type ProjectSubscription<WithPk extends boolean = true, Relationships extends null = null> =
    ( WithPk extends true ? { id : number | string } : {} )

export type ProjectSubscriptionConfiguration<WithPk extends boolean = true, Relationships extends null = null> =
    ( WithPk extends true ? { id : number | string } : {} ) &
    {
        deliveries : any
    }
