import { createGlobalStyle } from 'styled-components'

const GlobalStyle = createGlobalStyle`
  html,
  body {
    margin: 0;
  }

  body, input, button {
    font-family: monospace;
  }

  * {
    box-sizing: border-box;
  }
`

export default GlobalStyle