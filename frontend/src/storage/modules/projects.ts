import find from 'lodash/find'
import { StorageModule, StorageModuleConfig } from "@worldbrain/storex-pattern-modules";
import { STORAGE_VERSIONS } from "../versions";
import { Project, PostTag, ProjectMembership } from "../../types";
import { slugify } from '../../utils/string';
import { User } from '../../types/users';

export default class ProjectStorage extends StorageModule {
    getConfig() : StorageModuleConfig {
        return {
            collections: {
                project: {
                    version: STORAGE_VERSIONS[0].date,
                    fields: {
                        name: { type: 'string' },
                        slug: { type: 'string' },
                        shortDescription: { type: 'string' }
                    },
                    indices: [
                        { field: 'slug' }
                    ]
                },
                availableProjectPostTag: {
                    version: STORAGE_VERSIONS[0].date,
                    fields: {
                        label: { type: 'string' }
                    },
                    relationships: [
                        { childOf: 'project', reverseAlias: 'postTags' }
                    ]
                },
                projectPost: {
                    version: STORAGE_VERSIONS[0].date,
                    fields: {
                        title: { type: 'string' },
                        // slug: { type: 'string' },
                        shortDescription: { type: 'string' }
                    },
                    relationships: [
                        { childOf: 'project', reverseAlias: 'postTags' }
                    ]
                },
                projectPostTag: {
                    version: STORAGE_VERSIONS[0].date,
                    fields: {
                    },
                    relationships: [
                        { connects: ['projectPost', 'availableProjectPostTag'], aliases: ['post', 'tag'] }
                    ]
                },
                projectMembership: {
                    version: STORAGE_VERSIONS[0].date,
                    fields: {
                        role: { type: 'int' },
                    },
                    relationships: [
                        { connects: ['user', 'project'] }
                    ],
                    groupBy: [
                        { key: 'project', subcollectionName: 'users' },
                        { key: 'user', subcollectionName: 'memberships' }
                    ],
                }
            },
            operations: {
                createProject: {
                    operation: 'createObject',
                    collection: 'project',
                },
                findById: {
                    operation: 'findObject',
                    collection: 'project', 
                    args: { id: '$id:pk' }
                },
                findBySlug: {
                    operation: 'findObject',
                    collection: 'project', 
                    args: { slug: '$slug:string' }
                },
                findAvailableProjectPostTags: {
                    operation: 'findObjects',
                    collection: 'availableProjectPostTag', 
                    args: { project: '$projectPk:pk' }
                },
                findPostsByProject: {
                    operation: 'findObjects',
                    collection: 'projectPost', 
                    args: { project: '$projectPk:pk' }
                },
                findTagsByPost: {
                    operation: 'findObjects',
                    collection: 'projectPostTag', 
                    args: { post: '$postPk:pk' }
                },
                findProjectMembership: {
                    operation: 'findObject',
                    collection: 'projectMembership',
                    args: {
                        user: '$user:pk',
                        project: '$project:pk',
                    }
                }
            },
            accessRules: {
                permissions: {
                    project: {
                        update: {
                            prepare: [
                                { placeholder: 'rights', operation: 'findObject', collection: 'userRight', where: {
                                    user: '$context.user.id'
                                } }
                            ],
                            rule: {
                                exists: '$rights.canCreateProject'
                            }
                        }
                    }
                }
            }
        }
    }

    async createProject(project : Pick<Project, 'name' | 'shortDescription'>) : Promise<Project> {
        const slug = slugify(project.name)
        const { object } = await this.operation('createProject', { ...project, slug })
        return object
    }

    async getProjectBySlug(slug : string, options : { withPostTags? : boolean, withPosts? : boolean } = {}) : Promise<Project | null> {
        const project = await this.operation('findBySlug', { slug })
        if (!project) {
            return null
        }

        options.withPostTags = options.withPostTags || options.withPosts
        if (options.withPostTags) {
            project.postTags = await this.operation('findAvailableProjectPostTags', { projectPk: project.id })
        }
        if (options.withPosts) {
            project.posts = await this.operation('findPostsByProject', { projectPk: project.id }) as PostTag[]
            for (const post of project.posts) {
                post.tags = (await this.operation('findTagsByPost', { postPk: post.id })).map(
                    (tagConnection : any) => find(project.postTags, { id: tagConnection.tag })
                )
            }
        }
        return project
    }

    async getProjectsById(ids : Array<Project['id']>) : Promise<Project[]> {
        return await Promise.all(ids.map(id => this.operation('findById', { id })))
    }

    async getProjectMemebership(options : { user: User['id'], project: Project['id'] }) : Promise<ProjectMembership | null> {
        return await this.operation('findProjectMembership', options)
    }
}
