import * as generatedProjects from './storex-generated/projects'

export interface Project {
    id : number | string
    name: string
    slug: string
    shortDescription: string
    postTags: ProjectPostTag[]
    posts : Post[]
}

export type ProjectMembership<WithPk extends boolean = true> = generatedProjects.ProjectMembership<WithPk>

export enum PROJECT_MEMBERSHIP_ROLE {
    Admin = 1
}

export type ProjectPostTag = PostTag

export interface Post {
    id : number | string
    title: string
    shortDescription: string
    tags: Array<PostTag>
}

export interface PostTag {
    label : string
}

export interface PostDeliveryOptions {
    filterTags : {[tag : string] : PostTag}
    filterType : PostDeliveryFilterType
    action : PostDeliveryAction
}
export type PostDeliveryAction = 'weekly-email' | 'instant-email'
export type PostDeliveryFilterType = 'and' | 'or'
