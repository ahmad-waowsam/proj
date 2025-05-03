import React, { useState, useRef, useEffect } from "react";
import { Box, Typography, Dialog, IconButton, TextField, Button, useTheme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export default function OtpVerifyEmail({ open, onClose, email, onVerify }) {
  const [otp, setOtp] = useState(["", "", "", "", ""]);
  const inputRefs = useRef([]);
  const theme = useTheme();

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 5);
  }, []);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input if current input is filled
    if (value && index < 4) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Move to previous input on backspace if current input is empty
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();
    
    // Check if pasted content is numeric and has appropriate length
    if (/^\d+$/.test(pastedData)) {
      const digits = pastedData.split("").slice(0, 5);
      const newOtp = [...otp];
      
      digits.forEach((digit, index) => {
        if (index < 5) {
          newOtp[index] = digit;
        }
      });
      
      setOtp(newOtp);
      
      // Focus the next empty input or the last input
      const nextEmptyIndex = newOtp.findIndex(val => !val);
      if (nextEmptyIndex !== -1 && nextEmptyIndex < 5) {
        inputRefs.current[nextEmptyIndex].focus();
      } else if (digits.length < 5) {
        inputRefs.current[digits.length].focus();
      } else {
        inputRefs.current[4].focus();
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length === 5) {
      // Call the verification function passed from parent
      if (onVerify) {
        onVerify(otpValue);
      }
      
      // Parent will handle navigation and closing
    }
  };

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
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
        }
      }}
    >
      <Box sx={{ position: "relative", py: 2 }}>
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
          Verify Email
        </Typography>

        {/* Description */}
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            textAlign: "center",
            mb: 4,
          }}
        >
          An OTP has been sent on your email
          <br />
          <Typography 
            component="span" 
            sx={{ 
              fontWeight: 500,
              color: "text.primary" 
            }}
          >
            {email || "Adam@gmail.com"}
          </Typography>
        </Typography>

        {/* OTP Input Fields */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 2,
            }}
          >
            {otp.map((digit, index) => (
              <TextField
                key={index}
                inputRef={(el) => (inputRefs.current[index] = el)}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : null}
                placeholder="_"
                variant="outlined"
                inputProps={{
                  maxLength: 1,
                  style: {
                    textAlign: "center",
                    fontSize: "24px",
                    fontWeight: "bold",
                    padding: "8px",
                    width: "40px",
                    height: "40px",
                    color: "#8F6542", // Brown color for the numbers
                    caretColor: "transparent", // Hide the cursor
                  },
                }}
                sx={{
                  width: "55px",
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 3.5,
                    borderColor: digit ? "#8F6542" : "divider",
                    backgroundColor: "transparent",
                    "&.Mui-focused": {
                      borderColor: "#8F6542",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#8F6542",
                        borderWidth: 2,
                      },
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: digit ? "#8F6542" : "divider",
                      borderWidth: digit ? 2 : 1,
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#8F6542",
                    },
                  },
                  "& input::placeholder": {
                    color: "#8F6542",
                    opacity: 0.8,
                    fontSize: "26px",
                    fontWeight: "normal",
                    position: "relative",
                    top: "-2px", // Adjust this value to center the dash
                  },
                }}
              />
            ))}
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              backgroundColor: "#efbd93",
              color: "#000",
              fontWeight: 550,
              fontSize: 16,
              py: 1.5,
              borderRadius: 2,
              textTransform: "none",
              "&:hover": {
                backgroundColor: "#e0ad83",
              },
              boxShadow: "none",
              mt: 2,
            }}
          >
            Verify
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}