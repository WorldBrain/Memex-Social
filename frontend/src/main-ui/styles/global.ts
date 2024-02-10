import { createGlobalStyle } from 'styled-components'
import { theme } from './theme'

const GlobalStyle = createGlobalStyle`
  
  
  
  html {
    width: 100%;

    margin: 0;
    background: ${theme.colors.black};
  }
  
  body {
    width: 100%;
    height: 100vh;
    overflow: none;

    margin: 0;
    background: ${theme.colors.black};

    scrollbar-width: none;

&::-webkit-scrollbar {
    display: none;
}
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
