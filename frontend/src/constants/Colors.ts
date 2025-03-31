/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4'
const tintColorDark = '#fff'

export const Colors = {
    light: {
        text: '#f1f3f5',
        text2: '#ECEDEE',
        text3: '#93a5b7',
        text4: '#788ea5',
        secondaryText: '#815C82',
        background: '#161e27',
        background2: '#F8E7F6',
        background3: '#f7e1f5',
        grey50: '#F9FAFB',
        grey100: '#F4F4F6',
        grey200: '#E5E6EB',
        grey300: '#D3D5DA',
        grey400: '#9EA3AE',
        grey500: '#6C727F',
        border: '#2e4052',
        tint: '#769BFF',
        hover: '#1e2936',
        icon: '#687076',
        tabIconDefault: '#687076',
        tabIconSelected: tintColorLight,
        error: '#FF0000',
        white: '#FFFFFF',
        highlight: '#DD88CF',
        primary: '#4B164C',
        confirm: '#1aff66',
        transparent: 'rgba(52, 52, 52, 0)',
        yellow: '#f3ff71',
    },
    dark: {
        text: '#ECEDEE',
        background: '#151718',
        tint: tintColorDark,
        icon: '#9BA1A6',
        tabIconDefault: '#9BA1A6',
        tabIconSelected: tintColorDark,
    },
}
