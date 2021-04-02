import type { MemexTheme } from '@worldbrain/memex-common/lib/common-ui/styles/types'

declare module 'styled-components' {
    export interface DefaultTheme extends MemexTheme {}
}
