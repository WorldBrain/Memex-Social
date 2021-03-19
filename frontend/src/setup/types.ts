import { History } from 'history'
import { ScenarioReplayQueryParams } from '../services/scenarios/types'
import { Services } from '../services/types'
import { Storage } from '../storage/types'
import { BackendType } from '../types'
import { UiRunner } from '../main-ui/types'
import { FixtureFetcher } from '../services/fixtures/types'
import { ContentSharingQueryParams } from '../features/content-sharing/types'

export type MetaScreenSize = 'small' | 'large'

export type DevQueryParams = {
    meta?: string
    rpc?: string
    metaScreenSize?: MetaScreenSize
}
export type ProgramQueryParams = DevQueryParams &
    ScenarioReplayQueryParams &
    ContentSharingQueryParams
export interface MainProgramOptions {
    backend: BackendType
    queryParams: ProgramQueryParams
    navigateToScenarioStart?: boolean
    history?: History
    clipboard?: Pick<Clipboard, 'writeText'>
    logLogicEvents?: boolean
    mountPoint?: Element
    domUnavailable?: boolean // when running tests, don't use DOM
    uiRunner?: UiRunner
    dontRunUi?: boolean
    fixtureFetcher?: FixtureFetcher
}
export interface MainProgramSetup {
    storage: Storage
    services: Services
    stepWalkthrough?: () => void
    runUi: () => Promise<void>
}
