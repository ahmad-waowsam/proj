import React, { useContext } from "react";
import { ThemeContext } from "../../constants/ThemeContext";
import { Box } from "@mui/material";
import SunIcon from "../../assets/icons/sun-filled.svg";
import MoonIcon from "../../assets/icons/half-moon.svg";

export default function ThemeToggle() {
  const { mode, toggleTheme } = useContext(ThemeContext);

  return (
    <Box
      onClick={toggleTheme}
      sx={{
        display: "flex",
        alignItems: "center",
        position: "relative",
        width: "80px",
        height: "40px",
        borderRadius: "48px",
        backgroundColor: "secondary.main",
        padding: "4px",
        cursor: "pointer",
      }}
    >
      {/* Toggle Circle with Icon inside */}
      <Box
        sx={{
          position: "absolute",
          left: mode === "light" ? "4px" : "calc(100% - 36px)",
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          backgroundColor: "primary.main",
          transition: "all 0.3s ease",
          zIndex: 2, // Keeps it above the background
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={mode === "light" ? SunIcon : MoonIcon}
          alt="Theme Icon"
          style={{
            width: "20px",
            height: "20px",
            transition: "all 0.3s ease",
          }}
        />
      </Box>
    </Box>
  );
}
