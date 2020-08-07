import { History } from 'history'
import { ScenarioReplayQueryParams } from '../services/scenarios/types';
import { Services } from '../services/types';
import { Storage } from '../storage/types';
import { BackendType } from '../types';
import { UiRunner } from '../main-ui/types';
import { FixtureFetcher } from '../services/fixtures/types';

export type DevQueryParams = { meta?: string, rpc?: string }
export type ProgramQueryParams = DevQueryParams & ScenarioReplayQueryParams
export interface MainProgramOptions {
    backend: BackendType
    queryParams: ProgramQueryParams
    navigateToScenarioStart?: boolean
    history?: History,
    logLogicEvents?: boolean
    mountPoint?: Element
    domUnavailable?: boolean // when running tests, don't use DOM
    uiRunner?: UiRunner
    fixtureFetcher?: FixtureFetcher
}
export type MainProgramSetup = { storage: Storage, services: Services, stepWalkthrough?: () => void }
