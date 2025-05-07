import React, { createContext, useState, useMemo, useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { lightTheme, darkTheme, applyThemeProperties } from "./theme";

export const ThemeContext = createContext();

export const ThemeProviderWrapper = ({ children }) => {
  const [mode, setMode] = useState(
    localStorage.getItem("theme") || "light"
  );

  const theme = useMemo(
    () => (mode === "light" ? lightTheme : darkTheme),
    [mode]
  );

  useEffect(() => {
    // Store the mode preference
    localStorage.setItem("theme", mode);
    
    // Apply mode to HTML element for CSS targeting
    document.documentElement.setAttribute("data-theme", mode);
    
    // Apply CSS custom properties
    applyThemeProperties(mode);
    
    // Apply transition class to body for smooth transitions
    const body = document.body;
    body.classList.add("theme-transition");
    
    // Optional: Remove transition class after transition completes
    const transitionEndHandler = () => {
      // body.classList.remove("theme-transition");
    };
    
    body.addEventListener("transitionend", transitionEndHandler);
    
    return () => {
      body.removeEventListener("transitionend", transitionEndHandler);
    };
  }, [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
};
