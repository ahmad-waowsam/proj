import React, { createContext, useState, useMemo, useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { lightTheme, darkTheme } from "./theme";

export const ThemeContext = createContext();

export const ThemeProviderWrapper = ({ children }) => {
  const [mode, setMode] = useState("light");

  const theme = useMemo(
    () => (mode === "light" ? lightTheme : darkTheme),
    [mode]
  );

  useEffect(() => {
    // Get the body element
    const body = document.body;
    
    // Apply theme transition class
    body.classList.add("theme-transition");
    
    // Add data-theme attribute for CSS targeting
    body.setAttribute("data-theme", mode);
    
    // Clean up function to remove transition class after theme change completes
    const transitionEndHandler = () => {
      // Optional: Remove the transition class after transition completes
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
