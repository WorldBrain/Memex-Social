import {} from 'styled-components'
import { theme } from './main-ui/styles/theme'

declare module 'styled-components' {
    type Theme = typeof theme
    export interface DefaultTheme extends Theme {}
}
