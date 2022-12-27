import type { History } from 'history'
import type { ScenarioReplayQueryParams } from '../services/scenarios/types'
import type { Services } from '../services/types'
import type { Storage } from '../storage/types'
import type { BackendType } from '../types'
import type { UiRunner } from '../main-ui/types'
import type { FixtureFetcher } from '../services/fixtures/types'
import type { ContentSharingQueryParams } from '../features/content-sharing/types'
import type { YoutubeServiceOptions } from '@worldbrain/memex-common/lib/services/youtube/types'

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
    youtubeOptions?: YoutubeServiceOptions
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
