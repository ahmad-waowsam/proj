import { createTheme } from "@mui/material/styles";

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: "#ffffff",
    },
    primary: {
      main: "#efbd93",
    },
    secondary: {
      main: "#f4f4f4",
    },
    chatTitle: {
      main: "#717171",
    },
    divider: {
      main: "#eeeeee",
    },
    error: {
      main: "#ff3b30",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
        },
      },
    },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#000000",
    },
    primary: {
      main: "#efbd93",
    },
    secondary: {
      main: "#1b1b1b",
    },
    chatTitle: {
      main: "#717171",
    },
    divider: {
      main: "#000000",
    },
    error: {
      main: "#ff3b30",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
        },
      },
    },
  },
});
