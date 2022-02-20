import { createGlobalStyle } from 'styled-components'
import { theme } from './theme'

const GlobalStyle = createGlobalStyle`
  html,
  body {
    margin: 0;
    background: ${theme.colors.backgroundColor};
    height: 100vh;
  }

  body, input, button {
    font-family: monospace;
  }

  * {
    box-sizing: border-box;
  }

  }
`

export default GlobalStyle
