// import { theme } from './main-ui/styles/theme';

declare module 'styled-components-spacing' {
    type DefaultSpacingBreakpoints = 'mobile' | 'tablet' | 'desktop'
    type SpacingLength<Breakpoints extends string> =
        | SpacingValue
        | { [Breakpoint in Breakpoints]: SpacingValue }
    type SpacingValue =
        | 'none'
        | 'smallest'
        | 'small'
        | 'medium'
        | 'large'
        | 'larger'
        | 'largest'
    // type SpacingLength<Breakpoints extends string> = keyof typeof theme.spacing | { [Breakpoint in Breakpoints]: keyof typeof theme.spacing }

    interface SpacingOptions<
        Breakpoints extends string = DefaultSpacingBreakpoints
    > {
        horizontal: SpacingLength<Breakpoints>
        vertical: SpacingLength<Breakpoints>
        top: SpacingLength<Breakpoints>
        bottom: SpacingLength<Breakpoints>
        left: SpacingLength<Breakpoints>
        right: SpacingLength<Breakpoints>
        width: string
    }

    declare function Margin(
        props: { children: React.ReactNode } & Partial<SpacingOptions>,
    )
    declare function Padding(
        props: { children: React.ReactNode } & Partial<SpacingOptions>,
    )
}
