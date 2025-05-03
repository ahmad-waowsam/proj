import React, { useState } from "react";
import { Box, Typography, Dialog, IconButton, useTheme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AppTextfield from "../common/app-textfield";
import AppButton from "../common/app-button";
import EmailIcon from "../../assets/icons/baseline-email.svg";
import OtpVerification from "./otp-verification";
import ResetPassword from "./reset-password";

export default function ForgotPassword({ open, onClose }) {
  const [email, setEmail] = useState("");
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const theme = useTheme();

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle sending OTP logic here
    console.log("Sending OTP to:", email);
    // Show OTP verification dialog
    setShowOtpVerification(true);
  };

  const handleOtpClose = () => {
    setShowOtpVerification(false);
  };

  const handleOtpVerify = (otpValue) => {
    console.log("Verifying OTP:", otpValue, "for email:", email);
    // Here you would verify the OTP with your backend
    // On success, you could redirect to reset password page or show success message
    // For demo purposes, close OTP dialog and show password reset dialog
    setShowOtpVerification(false);
    setShowPasswordReset(true);
  };

  const handlePasswordResetClose = () => {
    setShowPasswordReset(false);
    onClose();
  };

  const handlePasswordReset = (newPassword, email) => {
    console.log("Password reset to:", newPassword, "for email:", email);
    // Here you would handle the password reset with your backend
    // Close the dialog
    setShowPasswordReset(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 4,
          height: 350,
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
          backgroundColor: 'rgba(0, 0, 0, 0.8)', // Darker backdrop for better contrast
        }
      }}
    >
      <Box sx={{ position: "relative" , pt: 10}}>
        {/* Close button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            top: -10,
            right: -10,
            color: "#FF1433",
            backgroundColor: "#f0f0f0", // Light grey background
            width: 32,
            height: 32,
            "&:hover": {
              backgroundColor: "#e0e0e0", // Slightly darker on hover
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
          Forgot Password?
        </Typography>

        {/* Description */}
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            textAlign: "center",
            mb: 3,
          }}
        >
          We require the email you registered
          <br />
          this account with.
        </Typography>

        {/* Form */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <AppTextfield
            label=""
            name="email"
            placeholder="E.g Adam@gmail.com"
            type="email"
            value={email}
            onChange={handleEmailChange}
            icon={EmailIcon}
          />

          <AppButton
            type="submit"
            sx={{
              mt: 1,
              backgroundColor: theme.palette.primary.main,
              color: "#000",
              fontWeight: 500,
              boxShadow: "none",
              height: 45,
              borderRadius: 2,
              fontSize: 15,
            }}
          >
            Send OTP
          </AppButton>
        </Box>
      </Box>
      {showOtpVerification && (
        <OtpVerification
          open={showOtpVerification}
          onClose={handleOtpClose}
          email={email}
          onVerify={handleOtpVerify}
        />
      )}
      {showPasswordReset && (
        <ResetPassword
          open={showPasswordReset}
          onClose={handlePasswordResetClose}
          email={email}
          onReset={handlePasswordReset}
        />
      )}
    </Dialog>
  );
}