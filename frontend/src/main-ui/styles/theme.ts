import { Theme } from './types'

export const theme: Theme = {
  spacing: {
    none: '0',
    smallest: '0.25rem',
    small: '0.5rem',
    medium: '1rem',
    large: '1.5rem',
    largest: '3rem',
  },
  colors: {
    background: 'white',
    warning: 'red',
    primary: '#3a2f45',
    subText: '#aeaeae',
    secondary: '#5cd9a6',
    purple: '#5671cf',
    grey: '#e0e0e0',
    black: '000',
    lightblack: '#2c2c2c',
    darkgrey: '#545454',
    overlay: {
      background: 'rgba(0, 0, 0, 0.1)',
      dialog: 'white',
    },
  },
  fonts: {
    primary: '"Poppins", sans-serif',
    secondary: '"Poppins", sans-serif',
  },
  hoverBackgrounds: {
    primary: '#e0e0e0',
  },
  borderRadii: {
    default: '3px',
  },
  fontSizes: {
    listTitle: '16px',
    url: '14px',
    text: '12px',
    smallText: '8px',
  },
  lineHeights: {
    listTitle: '24px',
    url: '21px',
    text: '18px',
    smallText: '12px',
},
  zIndices: {
    overlay: 50,
  },
}
