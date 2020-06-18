import { History } from 'history'
import { ScenarioReplayQueryParams } from '../services/scenarios/types';
import { Services } from '../services/types';
import { Storage } from '../storage/types';
import { BackendType } from '../types';

export type DevQueryParams = { meta?: string, rpc?: string }
export type ProgramQueryParams = DevQueryParams & ScenarioReplayQueryParams
export type MainProgramOptions = {
    backend: BackendType, history?: History, queryParams: ProgramQueryParams,
    logLogicEvents?: boolean, mountPoint?: Element
}
export type MainProgramSetup = { storage: Storage, services: Services, stepWalkthrough?: () => void }
