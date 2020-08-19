import { Services } from "../types"
import { Storage } from "../../storage/types"
import { GetCallModifications, CallModification } from "../../utils/call-modifier"
import { GenerateTestDataOptions } from "../fixtures/generation"

export type ScenarioReplayQueryParams = { scenario?: string, walkthrough?: string }

export type ScenarioModuleMap = { [module: string]: ScenarioMap }
export type ScenarioMap = { [name: string]: Scenario }
export interface Scenario {
    startRoute: { route: string, params?: { [key: string]: string } }
    authenticated?: boolean
    setup?: {
        callModifications?(context: { services: Services, storage: Storage }): CallModification[]
    }
    steps: ScenarioStep[]
    fixture?: string | GenerateTestDataOptions
    excludeFromMetaUI?: boolean
}

export type ScenarioStep =
    | ElementEventScenarioStep
    | ElementOutputScenarioStep
    | CallModificationStep
// | AuthStep

interface BaseScenarioStep {
    name: string
    description?: string

    dontWait?: boolean
    waitFor?: string
}

interface ElementScenarioStep extends BaseScenarioStep {
    target: string
}

export interface ElementEventScenarioStep extends ElementScenarioStep {
    // callModifications?: GetCallModifications
    eventName: string
    eventArgs: { [key: string]: any }
}

export interface ElementOutputScenarioStep extends ElementScenarioStep {
    output: { event: string, [k: string]: any }
}

export interface AuthStep extends BaseScenarioStep {
    auth: { action: 'login' }
}

export interface CallModificationStep extends BaseScenarioStep {
    callModifications: GetCallModifications
}
