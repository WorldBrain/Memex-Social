import { UILogic, UIEventHandler } from '../../../../../main-ui/classes/logic'
import { UITaskState } from '../../../../../main-ui/types'
import {
    CuratorSupportButtonBlockDependencies,
    CuratorSupportButtonBlockState,
    CuratorSupportButtonBlockEvent,
} from './types'

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
        try {
            const supporterRelationshipExists: boolean = await this.loadSupporterRelationship()
            this.emitMutation({
                supporterRelationshipExists: {
                    $set: supporterRelationshipExists,
                },
            })
            this._setInitialLoadTaskState('success')
        } catch (err) {
            this._setInitialLoadTaskState('error')
            console.log(err)
        }
    }

    async loadSupporterRelationship(): Promise<boolean> {
        // this is for the purposes of mocking up until the backend work is done
        const supporterRelationshipExists = false
        // const supporterRelationshipExists: boolean = await this.dependencies.services.userManagement.loadSupporterRelationship(
        //     this.dependencies.user.id,
        // )
        return supporterRelationshipExists
    }

    toggleSupporterRelationship: EventHandler<'toggleSupporterRelationship'> = async () => {
        try {
            // await this.dependencies.services.userManagement.toggleSupporterRelationship(
            //     this.dependencies.user.id,
            // )
            const supporterRelationshipExists: boolean = await this.loadSupporterRelationship()
            this._setSupporterRelationship(!supporterRelationshipExists)
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

    _setInitialLoadTaskState(taskState: UITaskState) {
        this.emitMutation({
            initialLoadTaskState: { $set: taskState },
        })
    }

    _setToggleRelationshipTaskState(taskState: UITaskState) {
        this.emitMutation({
            toggleRelationshipTaskState: { $set: taskState },
        })
    }
}
