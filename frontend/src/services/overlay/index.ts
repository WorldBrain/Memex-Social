import { EventEmitter } from 'events'

import type { OverlayServiceInterface } from '@worldbrain/memex-common/lib/services/overlay/types'

export default class OverlayService implements OverlayServiceInterface {
    events = new EventEmitter()
}
