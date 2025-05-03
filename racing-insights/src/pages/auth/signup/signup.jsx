import React, { useContext } from "react";
import { Box, useTheme, Button, Typography } from "@mui/material";
import { ThemeContext } from "../../../constants/ThemeContext";
import AuthLeftContainer from "../../../components/auth/auth-left-container";
import AuthLayout from "../../../layouts/auth-layout";
import smileSquare from "../../../assets/icons/smile-square.svg";
import SignupForm from "./signup-form";

export default function Signup() {
  const theme = useTheme();
  const { toggleTheme } = useContext(ThemeContext);

  return (
    <AuthLayout>
      <Box sx={{ 
        width: { xs: '100%', sm: '80%', md: '70%', lg: '50%' },
        maxWidth: '450px',
        px: { xs: 2, sm: 0 }
      }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: { xs: "center", sm: "flex-start" },
            mb: 4,
          }}
        >
          <Box sx={{ 
            display: "flex",
            alignItems: "center",
            justifyContent: { xs: "center", sm: "flex-start" },
            width: "100%",
            mb: 1
          }}>
            <img 
              src={smileSquare} 
              alt="smile-square" 
              style={{ 
                height: '24px',
                width: 'auto'
              }}
            />
            <Typography
              variant="h6"
              sx={{
                ml: 1,
                fontWeight: 600,
                color: theme.palette.text.primary,
              }}
            >
              Hey There! User
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{ 
              fontWeight: 500, 
              color: theme.palette.text.primary,
              textAlign: { xs: "center", sm: "left" },
            }}
          >
            Create a new race insight account
          </Typography>
        </Box>
        <Box>
          <SignupForm />
        </Box>
      </Box>
    </AuthLayout>
  );
}
