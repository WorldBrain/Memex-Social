import { UIEvent } from "../../main-ui/classes/logic";
import { Scenario, ScenarioStep, CallModification, GetCallModifications } from "./types";

export function scenario<Targets extends { [name: string]: UIEvent<{}> }>(builder: (options: {
    step: <Target extends keyof Targets, EventName extends keyof Targets[Target]>(options: (
        { name: string, target: Target, eventName: EventName, eventArgs: Targets[Target][EventName] } |
        { name: string, callModifications: GetCallModifications }
    )) => ScenarioStep
    callModification: <Object>(modification: CallModification<Object>) => CallModification<Object>
}) => Scenario) {
    return builder({
        step: (options) => {
            if ('target' in options) {
                return {
                    name: options.name,
                    target: options.target as string,
                    eventName: options.eventName as string,
                    eventArgs: options.eventArgs,
                    // callModifications: options.callModifications
                }
            } else {
                return {
                    name: options.name,
                    callModifications: options.callModifications
                }
            }
        },
        callModification: <Object>(modification: CallModification<Object>) => modification
    })
}
