import { StorageModule, StorageModuleConfig, StorageModuleConstructorArgs } from "@worldbrain/storex-pattern-modules";
import { STORAGE_VERSIONS } from "../versions";
import { Project, PostDeliveryOptions } from "../../types";
import { User } from "../../types/users";
import ProjectStorage from "./projects";

export default class SubscriptionStorage extends StorageModule {
    constructor(private options : StorageModuleConstructorArgs & { projects : ProjectStorage }) {
        super(options)
    }

    getConfig() : StorageModuleConfig {
        return {
            collections: {
                projectSubscription: {
                    version: STORAGE_VERSIONS[0].date,
                    fields: {
                    },
                    relationships: [
                        { connects: ['user', 'project'] }
                    ],
                },
                projectSubscriptionConfiguration: {
                    version: STORAGE_VERSIONS[0].date,
                    fields: {
                        deliveries: { type: 'json' },
                    },
                    relationships: [
                        { connects: ['user', 'project'] }
                    ],
                }
            },
            operations: {
                createSubscription: {
                    operation: 'executeBatch',
                    args: [[
                        {
                            placeholder: 'subscription',
                            operation: 'createObject',
                            collection: 'projectSubscription',
                            args: {
                                user: '$user:pk',
                                project: '$project:pk',
                            }
                        },
                        {
                            placeholder: 'preferences',
                            operation: 'createObject',
                            collection: 'projectSubscriptionConfiguration',
                            args: {
                                user: '$user:pk',
                                project: '$project:pk',
                                deliveries: '$deliveries:json'
                            }
                        },
                    ]]
                },
                updateSubscription: {
                    operation: 'updateObjects',
                    collection: 'projectSubscriptionConfiguration',
                    args: [
                        { user: '$user:pk', project: '$project:pk' },
                        { deliveries: '$deliveries:json' }
                    ]
                },
                removeSubscription: {
                    operation: 'executeBatch',
                    args: [[
                        {
                            placeholder: 'subscription',
                            operation: 'deleteObjects',
                            collection: 'projectSubscription',
                            where: {
                                user: '$user:pk',
                                project: '$project:pk',
                            }
                        },
                        {
                            placeholder: 'preferences',
                            operation: 'deleteObjects',
                            collection: 'projectSubscriptionConfiguration',
                            where: {
                                user: '$user:pk',
                                project: '$project:pk',
                            }
                        },
                    ]]
                },
                findSubscriptionPreferences: {
                    operation: 'findObject',
                    collection: 'projectSubscriptionConfiguration',
                    args: {
                        user: '$user:pk',
                        project: '$project:pk'
                    }
                },
                findSubscriptionsByUser: {
                    operation: 'findObjects',
                    collection: 'projectSubscription',
                    args: {
                        user: '$user:pk',
                    }
                },
            }
        }
    }

    async subscribeToProject(project : Project, options : { user : User, deliveries : PostDeliveryOptions[] }) {
        await this.operation('createSubscription', {
            user: options.user.id,
            project: project.id,
            deliveries: options.deliveries
        })
    }

    async updateSubscriptionPreferences(project : Project, options : { user : User, deliveries : PostDeliveryOptions[] }) {
        await this.operation('updateSubscription', {
            user: options.user.id,
            project: project.id,
            deliveries: options.deliveries
        })
    }

    async unsubscribeFromProject(project : Project, options : { user : User }) {
        await this.operation('removeSubscription', {
            user: options.user.id,
            project: project.id,
        })
    }

    async getProjectSubscription(project : Project, options : { user : User }) : Promise<{ deliveries : PostDeliveryOptions[] } | null> {
        const preferences = await this.operation('findSubscriptionPreferences', { user: options.user.id, project: project.id })
        return preferences || null
    }

    async getUserSubscriptions(user : User, options : { withProjects? : boolean } = {}) : Promise<Array<{
        project : Pick<Project, 'id'> | Project
    }>> {
        const subscriptions = await this.operation('findSubscriptionsByUser', { user: user.id }) as Array<{project : number | string}>
        if (!options.withProjects) {
            return subscriptions.map(subscription => ({ project: { id: subscription.project } }))
        }

        const projectIds = subscriptions.map(subscription => subscription.project)
        const projects = await this.options.projects.getProjectsById(projectIds)
        return projects.map(project => ({ project }))
    }
}
