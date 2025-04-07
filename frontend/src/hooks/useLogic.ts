import { Logic } from '../utils/logic'
import { useEffect, useRef, useState } from 'react'

export function useLogic<L extends Logic<any>>(create: () => L) {
    type State = ReturnType<L['getInitialState']>

    const logicRef = useRef(create())
    const logic = logicRef.current
    let [state, setState] = useState<State>(logic.getInitialState())
    logic.getState = () => state
    logic.setState = (newState) => {
        state = { ...state, ...newState }
        setState(state)
    }
    useEffect(() => {
        logic.initialize?.()

        if (logic.cleanup != null) {
            return () => {
                logic.cleanup()
                for (const fn of logic.cleanupFns) {
                    fn()
                }
            }
        }
    }, [])

    return { logic, state }
}
