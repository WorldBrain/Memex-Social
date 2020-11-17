import { Services } from "../types"
import { Storage } from "../../storage/types"
import { GetCallModifications, CallModification } from "../../utils/call-modifier"
import { GenerateTestDataOptions } from "../fixtures/generation"
import { UISignal, UIEvent } from "../../main-ui/classes/logic"

export type ScenarioReplayQueryParams = { scenario?: string, walkthrough?: string }

export type ScenarioModuleMap = { [module: string]: ScenarioMap<{}> }
export type ScenarioMap<Targets extends { [Target: string]: { signals?: UISignal<any>, events: UIEvent<{}> } }> = { [name: string]: Scenario<Targets> }
export type ScenarioSignal<Targets extends { [Target: string]: { signals?: UISignal<any> } }, Target extends keyof Targets> = {
    target: Target,
    signal: Targets[Target]['signals']
}
export interface Scenario<Targets extends { [Target: string]: { signals?: UISignal<any> } } = {}> {
    description?: string
    startRoute: { route: string, params?: { [key: string]: string } }
    authenticated?: boolean
    setup?: {
        callModifications?(context: { services: Services, storage: Storage }): CallModification[]
        waitForSignal?: ScenarioSignal<Targets, keyof Targets>
    }
    steps: ScenarioStep[]
    fixture?: string | GenerateTestDataOptions
    excludeFromMetaUI?: boolean
}

export type ScenarioStep =
    | ElementEventScenarioStep
    | CallModificationStep
// | AuthStep

interface BaseScenarioStep {
    name: string
    description?: string
    waitForSignal?: any
    waitForStep?: string
}

interface ElementScenarioStep extends BaseScenarioStep {
    target: string
}

export interface ElementEventScenarioStep extends ElementScenarioStep {
    // callModifications?: GetCallModifications
    eventName: string
    eventArgs: { [key: string]: any }
}

export interface AuthStep extends BaseScenarioStep {
    auth: { action: 'login' }
}

export interface CallModificationStep extends BaseScenarioStep {
    callModifications: GetCallModifications
}
