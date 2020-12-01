import { SpacingValue } from 'styled-components-spacing'

export type ViewportBreakpoint = 'mobile' | 'small' | 'big' | 'normal'

export type ColorThemeKeys =
  | 'background'
  | 'warning'
  | 'primary'
  | 'secondary'
  | 'subText'
  | 'grey'
  | 'black'

export type FontThemeKeys = 'primary' | 'secondary'

export type FontSizeThemeKeys = 'listTitle' | 'url'

export interface Theme {
  spacings: { [Key in SpacingValue]: string }
  colors: { [Key in ColorThemeKeys]: string } & {
    overlay: { [Key in 'background' | 'dialog']: string }
  }
  fonts: { [Key in FontThemeKeys]: string }
  fontSizes: { [Key in FontSizeThemeKeys]: string }
  hoverBackgrounds: { [Key in 'primary']: string }
  borderRadii: { [Key in 'default']: string }
  zIndices: { [Key in 'overlay']: number }
}
