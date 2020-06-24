import { UIEvent } from "../../main-ui/classes/logic";
import { Scenario, ScenarioStep } from "./types";

export function scenario<Targets extends { [name: string]: UIEvent<{}> }>(builder: (options: {
    step: <Target extends keyof Targets, EventName extends keyof Targets[Target]>(options: { name: string, target: Target, eventName: EventName, eventArgs: Targets[Target][EventName] }) => ScenarioStep
}) => Scenario) {
    return builder({
        step: (options) => ({
            name: '',
            target: options.target as string,
            eventName: options.eventName as string,
            eventArgs: options.eventArgs
        })
    })
}
