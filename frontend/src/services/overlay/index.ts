import { EventEmitter } from 'events'

import type { OverlayServiceInterface } from './types'

export default class OverlayService implements OverlayServiceInterface {
    events = new EventEmitter()
}
