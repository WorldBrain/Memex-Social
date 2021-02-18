import { EventEmitter } from 'events'

type RectSize = { width: number; height: number }

export class DeviceService {
    events = new EventEmitter()
    private cachedRootSize: RectSize

    constructor(
        private options: {
            rootElement: { clientWidth: number; clientHeight: number }
        },
    ) {
        this.cachedRootSize = this.calculateRootSize()
    }

    get rootSize(): RectSize {
        return this.cachedRootSize
    }

    processRootResize() {
        this.cacheRootSize()
        this.events.emit('rootResize')
    }

    private cacheRootSize() {
        this.cachedRootSize = this.calculateRootSize()
    }

    private calculateRootSize(): RectSize {
        return {
            width: this.options.rootElement?.clientWidth,
            height: this.options.rootElement?.clientHeight,
        }
    }
}
