import { SpacingValue } from "styled-components-spacing";

import { Theme } from "./types";

const spacing: { [Key in SpacingValue]: string } = {
  none: "0",
  smallest: "0.25rem",
  small: "0.5rem",
  medium: "1rem",
  large: "1.5rem",
  largest: "3rem",
};

export const theme: Theme = {
  spacing,
  colors: {
    background: "white",
    warning: "red",
    primary: "#3a2f45",
    subText: "#aeaeae",
    secondary: "#5cd9a6",
    grey: "#e0e0e0",
    black: "000",
    overlay: {
      background: "rgba(0, 0, 0, 0.1)",
      dialog: "white",
    },
  },
  fonts: {
    primary: '"Poppins", sans-serif',
    secondary: '"Poppins", sans-serif',
  },
  hoverBackground: {
    primary: "#e0e0e0",
  },
  borderRadius: {
    default: "3px",
  },
  fontSize: {
    listTitle: "16px",
    url: "14px",
  },
  zIndices: {
    overlay: 50,
  },
};
