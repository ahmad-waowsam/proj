import { createTheme } from "@mui/material/styles";

// Theme color values
const themeColors = {
  light: {
    bgPrimary: '#ffffff',
    bgSecondary: '#f9f9f9',
    bgTertiary: '#f4f4f4',
    bgChatUser: '#efbd93',
    bgChatBot: '#f9f9f9',
    textPrimary: '#212121',
    textSecondary: '#717171',
    textTertiary: '#9e9e9e',
    textOnAccent: '#ffffff',
    borderLight: '#eeeeee',
    borderAccent: '#efbd93',
    accent: '#efbd93',
    accentDark: '#e0a97d',
    accentLight: '#f7d9bd',
    error: '#ff3b30',
    success: '#34c759',
    warning: '#ffcc00',
  },
  dark: {
    bgPrimary: '#121212',
    bgSecondary: '#1e1e1e',
    bgTertiary: '#2d2d2d',
    bgChatUser: 'rgba(239, 189, 147, 0.2)',
    bgChatBot: 'rgba(255, 255, 255, 0.05)',
    textPrimary: '#f0f0f0',
    textSecondary: '#b0b0b0',
    textTertiary: '#757575',
    textOnAccent: '#212121',
    borderLight: 'rgba(255, 255, 255, 0.1)',
    borderAccent: '#efbd93',
    accent: '#efbd93',
    accentDark: '#e0a97d',
    accentLight: 'rgba(239, 189, 147, 0.3)',
    error: '#ff453a',
    success: '#30d158',
    warning: '#ffd60a',
  }
};

// CSS custom properties for theme tokens
const cssVars = {
  light: {
    '--bg-primary': themeColors.light.bgPrimary,
    '--bg-secondary': themeColors.light.bgSecondary,
    '--bg-tertiary': themeColors.light.bgTertiary,
    '--bg-chat-user': themeColors.light.bgChatUser,
    '--bg-chat-bot': themeColors.light.bgChatBot,
    '--text-primary': themeColors.light.textPrimary,
    '--text-secondary': themeColors.light.textSecondary,
    '--text-tertiary': themeColors.light.textTertiary,
    '--text-on-accent': themeColors.light.textOnAccent,
    '--border-light': themeColors.light.borderLight,
    '--border-accent': themeColors.light.borderAccent,
    '--accent': themeColors.light.accent,
    '--accent-dark': themeColors.light.accentDark,
    '--accent-light': themeColors.light.accentLight,
    '--shadow-sm': '0 2px 4px rgba(0, 0, 0, 0.05)',
    '--shadow-md': '0 4px 6px rgba(0, 0, 0, 0.1)',
    '--error': themeColors.light.error,
    '--success': themeColors.light.success,
    '--warning': themeColors.light.warning,
  },
  dark: {
    '--bg-primary': themeColors.dark.bgPrimary,
    '--bg-secondary': themeColors.dark.bgSecondary,
    '--bg-tertiary': themeColors.dark.bgTertiary,
    '--bg-chat-user': themeColors.dark.bgChatUser,
    '--bg-chat-bot': themeColors.dark.bgChatBot,
    '--text-primary': themeColors.dark.textPrimary,
    '--text-secondary': themeColors.dark.textSecondary,
    '--text-tertiary': themeColors.dark.textTertiary,
    '--text-on-accent': themeColors.dark.textOnAccent,
    '--border-light': themeColors.dark.borderLight,
    '--border-accent': themeColors.dark.borderAccent,
    '--accent': themeColors.dark.accent,
    '--accent-dark': themeColors.dark.accentDark,
    '--accent-light': themeColors.dark.accentLight,
    '--shadow-sm': '0 2px 4px rgba(0, 0, 0, 0.2)',
    '--shadow-md': '0 4px 8px rgba(0, 0, 0, 0.4)',
    '--error': themeColors.dark.error,
    '--success': themeColors.dark.success,
    '--warning': themeColors.dark.warning,
  }
};

// Apply CSS custom properties to :root
export const applyThemeProperties = (mode) => {
  const root = document.documentElement;
  const vars = cssVars[mode];
  
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
};

// Material UI themes that use direct color values
export const lightTheme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: themeColors.light.bgPrimary,
      paper: themeColors.light.bgSecondary,
    },
    text: {
      primary: themeColors.light.textPrimary,
      secondary: themeColors.light.textSecondary,
    },
    primary: {
      main: themeColors.light.accent,
      dark: themeColors.light.accentDark,
      light: themeColors.light.accentLight,
      contrastText: themeColors.light.textOnAccent,
    },
    secondary: {
      main: themeColors.light.bgTertiary,
    },
    chatTitle: {
      main: themeColors.light.textSecondary,
    },
    divider: themeColors.light.borderLight,
    error: {
      main: themeColors.light.error,
    },
    success: {
      main: themeColors.light.success,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: "8px",
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: "16px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        },
      },
    },
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 500 },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    "none",
    "0 2px 4px rgba(0, 0, 0, 0.05)",
    "0 4px 6px rgba(0, 0, 0, 0.1)",
    // Default shadows for the rest
  ],
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: themeColors.dark.bgPrimary,
      paper: themeColors.dark.bgSecondary,
    },
    text: {
      primary: themeColors.dark.textPrimary,
      secondary: themeColors.dark.textSecondary,
    },
    primary: {
      main: themeColors.dark.accent,
      dark: themeColors.dark.accentDark,
      light: themeColors.dark.accentLight,
      contrastText: themeColors.dark.textOnAccent,
    },
    secondary: {
      main: themeColors.dark.bgTertiary,
    },
    chatTitle: {
      main: themeColors.dark.textSecondary,
    },
    divider: themeColors.dark.borderLight,
    error: {
      main: themeColors.dark.error,
    },
    success: {
      main: themeColors.dark.success,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: "8px",
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: "16px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.4)",
        },
      },
    },
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 500 },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    "none",
    "0 2px 4px rgba(0, 0, 0, 0.2)",
    "0 4px 8px rgba(0, 0, 0, 0.4)",
  ],
});
