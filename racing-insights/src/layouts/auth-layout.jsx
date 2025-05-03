import React, { useContext } from "react";
import { Box, useTheme, Button, Typography, useMediaQuery } from "@mui/material";
import { ThemeContext } from "../constants/ThemeContext";
import AuthLeftContainer from "../components/auth/auth-left-container";
import ThemeToggle from "../components/common/theme-toggle";

export default function AuthLayout({ children }) {
  const theme = useTheme();
  const { toggleTheme } = useContext(ThemeContext);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      component="main"
      sx={{
        backgroundColor: theme.palette.background.default,
        minHeight: '100vh',
        maxHeight: '100vh',
        display: "flex",
        flexDirection: { xs: 'column', md: 'row' },
        overflow: 'hidden',
        margin: 0,
        padding: 0,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {/* Left side with background image */}
      <Box sx={{ 
        width: { xs: '100%', md: '50%' },
        height: { xs: '30vh', md: '100vh' },
        display: { xs: isMobile ? 'none' : 'block', md: 'block' },
        flexShrink: 0
      }}>
        <AuthLeftContainer />
      </Box>

      {/* Right side with form */}
      <Box
        sx={{
          width: { xs: '100%', md: '50%' },
          height: '100vh',
          display: "flex",
          flexDirection: "column",
          position: "relative",
          px: { xs: 2, sm: 4, md: 0 },
          overflow: 'auto',
          flexShrink: 0,
        }}
        className="gradient-background"
      >
        <Box
          sx={{
            position: "absolute",
            top: { xs: 12, md: 20 },
            right: { xs: 12, md: 20 },
            zIndex: 1
          }}
        >
          <ThemeToggle />
        </Box>
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            py: { xs: 4, md: 0 },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
