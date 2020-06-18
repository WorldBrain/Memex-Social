import every from 'lodash/every'
import { UILogic, UIEvent, UIMutation } from "../../classes/logic"
import { PostTag, PostDeliveryOptions, PostDeliveryAction, PostDeliveryFilterType } from "../../../types";

export interface State {
    mode: 'configure' | 'confirm-unsubscribe'
    deliveries : PostDeliveryOptions[]
    canSubmit : boolean
    canAddNew : boolean
    canRemove : boolean
}
export type Event = UIEvent<{
    addNewDelivery : { }
    toggleFilterTag : { delivery : number, tag : PostTag }
    setAction : { delivery : number, action : PostDeliveryAction }
    setFilterType : { delivery : number, filterType : PostDeliveryFilterType }
    removeDelivery : { delivery : number }
    submit : {}

    initiateUnsubscribe: {}
    cancelUnsubscribe: {}
    confirmUnsubscribe: {}
}>

export default class Logic extends UILogic<State, Event> {
    constructor(private options : {
        onPreferenceSave : (preferences : PostDeliveryOptions[]) => void,
        onUnsubscribe : () => void
        initialDeliveries? : PostDeliveryOptions[]
    }) {
        super()
    }

    getInitialState() : State {
        const deliveries = this.options.initialDeliveries || [createNewDelivery()]
        const canSubmit = this._determineCanSumbit({ deliveries })
        return {
            mode: 'configure',
            deliveries: deliveries,
            canSubmit,
            canAddNew: canSubmit,
            canRemove: canSubmit,
        }
    }

    processToggleFilterTag(event : Event['toggleFilterTag'], options : { state : State }) : UIMutation<State> {
        const tagShouldBeActive = !options.state.deliveries[event.delivery].filterTags[event.tag.label]
        const deliveryMutation = {
            deliveries: {[event.delivery]: {
                filterTags:
                    tagShouldBeActive
                    ? {[event.tag.label]: {$set: event.tag}}
                    : {$unset: [event.tag.label]},
            }}
        }

        const canSubmit = this._determineCanSumbit(this.withMutation(options.state, deliveryMutation))
        return {
            ...deliveryMutation,
            canSubmit: { $set: canSubmit },
            canAddNew: { $set: canSubmit },
        }
    }

    processAddNewDelivery(event : Event['addNewDelivery'], options : { state : State }) : UIMutation<State> {
        if (!this._determineCanSumbit(options.state)) {
            return {}
        }

        return {
            deliveries: {$push: [createNewDelivery()]},
            canRemove: {$set: true}
        }
    }

    processRemoveDelivery(event : Event['removeDelivery'], options : { state : State }) : UIMutation<State> {
        const removeMutation : UIMutation<State> = {
            deliveries: {$splice: [[event.delivery, 1]]}
        }
        const stateAfterRemove = this.withMutation(options.state, removeMutation)

        const canSubmit = this._determineCanSumbit(stateAfterRemove)
        return {
            ...removeMutation,
            canRemove: {$set: stateAfterRemove.deliveries.length > 1},
            canSubmit: {$set: canSubmit},
            canAddNew: {$set: canSubmit},
        }
    }

    processSetAction(event : Event['setAction'], options : { state : State }) : UIMutation<State> {
        return {
            deliveries: {
                [event.delivery]: {action: {$set: event.action}}
            }
        }
    }

    processSetFilterType(event : Event['setFilterType'], options : { state : State }) : UIMutation<State> {
        return {
            deliveries: {
                [event.delivery]: {filterType: {$set: event.filterType}}
            }
        }
    }

    async processSubmit(event : never, options : { state : State }) {
        await this.options.onPreferenceSave(options.state.deliveries)
    }

    _determineCanSumbit(state : Pick<State, 'deliveries'>) {
        const isDeliveryValid = (delivery : PostDeliveryOptions, index : number) => (
            Object.keys(delivery.filterTags).length > 0
        )
        return every(state.deliveries, isDeliveryValid)
    }

    processInitiateUnsubscribe() : UIMutation<State> {
        return { mode: { $set: 'confirm-unsubscribe' } }
    }

    processCancelUnsubscribe() : UIMutation<State> {
        return { mode: { $set: 'configure' } }
    }

    processConfirmUnsubscribe() {
        this.options.onUnsubscribe()
    }
}

function createNewDelivery(): PostDeliveryOptions {
    return {
        filterTags: {},
        filterType: 'and',
        action: 'weekly-email',
    }
}

