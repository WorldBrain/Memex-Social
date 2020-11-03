import { UIEvent, UISignal } from "../../main-ui/classes/logic";
import { Scenario, ScenarioStep } from "./types";
import { GetCallModifications, CallModification } from "../../utils/call-modifier";

export function scenario<
    Targets extends { [name: string]: { events: UIEvent<{}>, signals?: UISignal<any> } }
>(builder: (options: {
    step: <Target extends keyof Targets, EventName extends keyof Targets[Target]['events']>(options: (
        {
            name: string,
            target: Target,
            eventName: EventName,
            eventArgs: Targets[Target]['events'][EventName],
            waitForSignal?: Targets[Target]['signals'],
            waitForStep?: string
        } |
        {
            name: string,
            callModifications: GetCallModifications,
            waitForSignal?: Targets[Target]['signals'],
            waitForStep?: string
        }
    )) => ScenarioStep
    callModification: <Object>(modification: CallModification<Object>) => CallModification<Object>
}) => Scenario<Targets>) {
    return builder({
        step: (options) => {
            if ('target' in options) {
                return {
                    name: options.name,
                    target: options.target as string,
                    eventName: options.eventName as string,
                    eventArgs: options.eventArgs,
                    waitForSignal: options.waitForSignal,
                    waitForStep: options.waitForStep,
                    // callModifications: options.callModifications
                }
            } else {
                return {
                    name: options.name,
                    callModifications: options.callModifications,
                    waitForSignal: options.waitForSignal,
                    waitForStep: options.waitForStep,
                }
            }
        },
        callModification: <Object>(modification: CallModification<Object>) => modification
    })
}
