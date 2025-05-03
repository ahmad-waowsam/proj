import { React, useState } from "react";
import { Box, useTheme, Typography } from "@mui/material";
import { ThemeContext } from "../../../constants/ThemeContext";
import AuthLayout from "../../../layouts/auth-layout";
import SigninForm from "./signin-form";
import smileSquare from "../../../assets/icons/smile-square.svg";

export default function Signin() {
  const theme = useTheme();

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
              Hey There! User{" "}
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              color: theme.palette.text.secondary,
              textAlign: { xs: "center", sm: "left" },
            }}
          >
            Login to continue using your account!
          </Typography>
        </Box>
        <Box>
          <SigninForm />
        </Box>
      </Box>
    </AuthLayout>
  );
}
