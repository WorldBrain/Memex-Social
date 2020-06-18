export type ScenarioReplayQueryParams = { scenario? : string, walkthrough? : string }

export type ScenarioModuleMap = {[module : string] : ScenarioMap}
export type ScenarioMap = {[name : string] : Scenario}
export interface Scenario {
    startRoute : { route : string, params? : {[key : string] : string} }
    authenticated? : boolean
    steps : ScenarioStep[]
    fixture? : string
}

export type ScenarioStep =
    ElementEventScenarioStep
    | ElementOutputScenarioStep
    // | AuthStep

interface BaseScenarioStep {
    name : string
    description? : string

    dontWait? : boolean
    waitFor? : string
}

interface ElementScenarioStep extends BaseScenarioStep {
    target : string
}

export interface ElementEventScenarioStep extends ElementScenarioStep {
    event : any
}

export interface ElementOutputScenarioStep extends ElementScenarioStep {
    output: { event: string, [k : string] : any }
}

export interface AuthStep extends BaseScenarioStep {
    auth : { action : 'login' }
}
