import React from "react";
import { Box, Typography, Dialog, IconButton, useTheme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AppButton from "../common/app-button";
import CheckIcon from "@mui/icons-material/Check";
import successIcon from "../../assets/icons/password-changed-success-icon.svg";

export default function PasswordChanged({ open, onClose, onSignIn }) {
  const theme = useTheme();
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 4,
          maxWidth: 400,
          width: "100%",
          p: 3,
          m: 2,
          bgcolor: theme.palette.mode === 'dark' ? '#0A0A0A' : 'background.paper',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: 'none',
          backgroundImage: 'none',
          overflowY: 'visible',
        },
      }}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0)',
        }
      }}
      sx={{
        zIndex: 1400, // Higher than the parent dialog
      }}
    >
      <Box sx={{ position: "relative", pt: 15 }}>
        {/* Close button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            top: -10,
            right: -10,
            color: "#FF1433",
            backgroundColor: "#f0f0f0",
            width: 32,
            height: 32,
            "&:hover": {
              backgroundColor: "#e0e0e0",
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        {/* Success Icon */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mb: 3,
          }}
        >
          <Box
            sx={{
              backgroundColor: "#222",
              borderRadius: "50%",
              width: 90,
              height: 90,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              border: "1.5px solid #333",
              outline: "6px solid rgba(34, 34, 34, 0.15)",
            }}
          >
            <Box
              component="img"
              src={successIcon}
              alt="Success Icon"
            />
          </Box>
        </Box>

        {/* Title */}
        <Typography
          variant="h4"
          sx={{
            fontWeight: 600,
            textAlign: "center",
            mb: 1,
            fontSize: 28,
          }}
        >
          Password Changed!
        </Typography>

        {/* Description */}
        <Typography
          variant="body1"
          sx={{
            color: "text.secondary",
            textAlign: "center",
            mb: 4,
            fontSize: 16,
          }}
        >
          Login again to continue using your
          <br />
          account.
        </Typography>

        {/* Sign In Button */}
        <AppButton
          onClick={onSignIn}
          sx={{
            backgroundColor: "#efbd93",
            color: "#000",
            fontWeight: 500,
            boxShadow: "none",
            height: 45,
            borderRadius: 2,
            fontSize: 15,
            "&:hover": {
              backgroundColor: "#e0ad83",
            },
          }}
        >
          Sign in
        </AppButton>
      </Box>
    </Dialog>
  );
}