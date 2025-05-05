import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import authBgImage from "../../assets/images/auth-bg-image.jpg";
import cornerComponent from "../../assets/icons/corner-component.svg";

export default function AuthLeftContainer() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        backgroundImage: `url(${authBgImage})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "flex-start",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <img 
        src={cornerComponent} 
        alt="Corner decoration" 
        style={{ 
          height: "auto",
          width: "25%",
          maxWidth: "200px",
          minWidth: "120px"
        }} 
      />

      <Typography
        variant="h3"
        fontWeight="600"
        sx={{
          width: { xs: '80%', sm: '70%', md: '60%' },
          color: theme.palette.mode === 'dark' ? '#ffffff' : theme.palette.background.default,
          p: { xs: 4, sm: 6, md: 8 },
          fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
          lineHeight: 1.2,
        }}
      >
        Now making searching easier through AI
      </Typography>
    </Box>
  );
}
