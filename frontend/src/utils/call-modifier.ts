import createResolvable, { Resolvable } from '@josephg/resolvable'
import { Services } from '../services/types'
import { Storage } from '../storage/types'

export type GetCallModifications = (context: {
    services: Services
    storage: Storage
}) => CallModification[]

export type CallModification<Object = any> =
    | {
          name: string
          object: Object
          property: keyof Object
          modifier: 'block' | 'sabotage'
      }
    | {
          name: string
          modifier: 'undo'
      }

export default class CallModifier {
    private modifiedCalls: { [name: string]: { undo: () => void } } = {}

    modify(
        context: { storage: Storage; services: Services },
        getModifications: GetCallModifications,
    ) {
        const modifications = getModifications(context)
        for (const modification of modifications) {
            if (modification.modifier === 'undo') {
                this.modifiedCalls[modification.name].undo()
                continue
            }

            const { object, property } = modification
            this.modifiedCalls[modification.name] = this.rawModify(
                object,
                property,
                modification.modifier,
            )
        }
    }

    rawModify<Object>(
        object: Object,
        property: keyof Object,
        modifier: CallModification['modifier'],
    ) {
        const blockPromises: Array<Resolvable<void>> = []
        const origCall = (object[property] as any) as (...args: any[]) => any
        if (modifier === 'sabotage') {
            object[property] = (async (...args: any[]) => {
                throw new Error(
                    `Call '${String(property)}' was modified to throw an error`,
                )
            }) as any
        } else if (modifier === 'block') {
            object[property] = (async (...args: any[]) => {
                const blockPromise = createResolvable()
                blockPromises.push(blockPromise)
                await blockPromise
                return origCall.apply(object, args)
            }) as any
        }
        return {
            unblockOldest: () => {
                const resolvable = blockPromises.shift()
                if (!resolvable) {
                    throw new Error(
                        `Could not unblock oldest promise, because there's no pending calls`,
                    )
                }
                resolvable.resolve()
            },
            undo: () => {
                ;(object as any)[property] = origCall
                for (const resolvable of blockPromises) {
                    resolvable.resolve()
                }
            },
        }
    }
}
