import React, { useState } from "react";
import { Box, Typography, Dialog, IconButton, useTheme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AppTextfield from "../common/app-textfield";
import AppButton from "../common/app-button";
import PasswordIcon from "../../assets/icons/password-rounded.svg";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import PasswordChanged from "./password-changed";

export default function ResetPassword({ open, onClose, onReset, email }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [showPasswordChanged, setShowPasswordChanged] = useState(false);
  const theme = useTheme();

  const handleNewPasswordChange = (e) => {
    setNewPassword(e.target.value);
    validatePasswords(e.target.value, confirmPassword);
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    validatePasswords(newPassword, e.target.value);
  };

  const validatePasswords = (newPass, confirmPass) => {
    if (confirmPass && newPass !== confirmPass) {
      setPasswordError("Passwords do not match");
    } else {
      setPasswordError("");
    }
  };

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      return;
    }
    
    // Show password changed dialog
    setShowPasswordChanged(true);
    
    // Call the reset function passed from parent
    // We'll call this when the user clicks "Sign in" in the success dialog
    // if (onReset) {
    //   onReset(newPassword, email);
    // }
  };

  const handlePasswordChangedClose = () => {
    setShowPasswordChanged(false);
    onClose();
  };

  const handleSignIn = () => {
    // Call the reset function passed from parent before closing
    if (onReset) {
      onReset(newPassword, email);
    }
    
    setShowPasswordChanged(false);
    onClose();
  };

  return (
    <>
      <Dialog
        open={open && !showPasswordChanged}
        onClose={onClose}
        PaperProps={{
          sx: {
            borderRadius: 4,
            maxWidth: 450,
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
      >
        <Box sx={{ position: "relative", pt:10 }}>
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

          {/* Title */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              textAlign: "center",
              mb: 1,
            }}
          >
            Reset Password
          </Typography>

          {/* Description */}
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              textAlign: "center",
              mb: 3,
            }}
          >
            Last final step enter a very strong
            <br />
            password.
          </Typography>

          {/* Form */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            <AppTextfield
              label="New Password"
              name="newPassword"
              placeholder="Password Here"
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={handleNewPasswordChange}
              icon={PasswordIcon}
              endAdornment={
                showNewPassword ? (
                  <VisibilityOffIcon
                    onClick={toggleNewPasswordVisibility}
                    style={{ cursor: "pointer", color: theme.palette.primary.main }}
                  />
                ) : (
                  <VisibilityIcon
                    onClick={toggleNewPasswordVisibility}
                    style={{ cursor: "pointer", color: theme.palette.primary.main }}
                  />
                )
              }
            />

            <AppTextfield
              label="Confirm Password"
              name="confirmPassword"
              placeholder="Password Here"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              error={passwordError}
              icon={PasswordIcon}
              endAdornment={
                showConfirmPassword ? (
                  <VisibilityOffIcon
                    onClick={toggleConfirmPasswordVisibility}
                    style={{ cursor: "pointer", color: theme.palette.primary.main }}
                  />
                ) : (
                  <VisibilityIcon
                    onClick={toggleConfirmPasswordVisibility}
                    style={{ cursor: "pointer", color: theme.palette.primary.main }}
                  />
                )
              }
            />

            <AppButton
              type="submit"
              sx={{
                mt: 2,
                backgroundColor: theme.palette.primary.main,
                color: "#000",
                fontWeight: 500,
                boxShadow: "none",
                height: 45,
                borderRadius: 2,
                fontSize: 15,
              }}
            >
              Change Password
            </AppButton>
          </Box>
        </Box>
      </Dialog>

      {showPasswordChanged && (
        <PasswordChanged
          open={showPasswordChanged}
          onClose={handlePasswordChangedClose}
          onSignIn={handleSignIn}
        />
      )}
    </>
  );
}