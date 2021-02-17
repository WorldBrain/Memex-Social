import { ViewportBreakpoint } from './types'

export function getViewportBreakpoint(
    viewportWidth: number,
): ViewportBreakpoint {
    if (viewportWidth <= 500) {
        return 'mobile'
    }

    if (viewportWidth >= 500 && viewportWidth <= 850) {
        return 'small'
    }

    if (viewportWidth > 850) {
        return 'big'
    }

    return 'normal'
}
