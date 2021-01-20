import { UILogic, UIEventHandler } from '../../../../../main-ui/classes/logic'
import UserPublicProfile from '../../../types'
import {
    CuratorSupportButtonBlockDependencies,
    CuratorSupportButtonBlockState,
    CuratorSupportButtonBlockEvent,
} from './types'
import { TaskState } from '../profile-popup/types'

type EventHandler<
    EventName extends keyof CuratorSupportButtonBlockEvent
> = UIEventHandler<
    CuratorSupportButtonBlockState,
    CuratorSupportButtonBlockEvent,
    EventName
>

export default class CuratorSupportButtonBlockLogic extends UILogic<
    CuratorSupportButtonBlockState,
    CuratorSupportButtonBlockEvent
> {
    constructor(private dependencies: CuratorSupportButtonBlockDependencies) {
        super()
    }

    getInitialState(): CuratorSupportButtonBlockState {
        return {
            initialLoadTaskState: 'running',
            toggleRelationshipTaskState: 'pristine',
            supporterRelationshipExists: false,
        }
    }

    init: EventHandler<'init'> = async () => {
        const supporterRelationshipExists: boolean = await this.loadSupporterRelationship()
        this.emitMutation({
            supporterRelationshipExists: { $set: supporterRelationshipExists },
        })
    }

    async loadSupporterRelationship(): Promise<boolean> {
        const supporterRelationshipExists: boolean = await this.dependencies.services.userManagement.loadSupporterRelationship(
            this.dependencies.user.id,
        )
        return supporterRelationshipExists
    }

    toggleSupporterRelationship: EventHandler<'toggleSupporterRelationship'> = async () => {
        try {
            await this.dependencies.services.userManagement.toggleSupporterRelationship(
                this.dependencies.user.id,
            )
            const supporterRelationshipExists: boolean = await this.loadSupporterRelationship()
            this._setSupporterRelationship(supporterRelationshipExists)
            this._setToggleRelationshipTaskState('success')
        } catch (err) {
            this._setToggleRelationshipTaskState('error')
        }
    }

    _setSupporterRelationship(isSupported: boolean) {
        this.emitMutation({
            supporterRelationshipExists: { $set: isSupported },
        })
    }

    _setToggleRelationshipTaskState(taskState: TaskState) {
        this.emitMutation({
            toggleRelationshipTaskState: { $set: taskState },
        })
    }
}
