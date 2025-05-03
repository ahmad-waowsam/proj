import { React, useState } from "react";
import { Box, useTheme, Checkbox, Typography, Alert } from "@mui/material";
import AppTextfield from "../../../components/common/app-textfield";
import EmailIcon from "../../../assets/icons/baseline-email.svg";
import PasswordIcon from "../../../assets/icons/password-rounded.svg";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import AppButton from "../../../components/common/app-button";
import { login } from "../../../api/chat";
import { useNavigate } from "react-router-dom";

export default function SigninForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const theme = useTheme();
  const navigate = useNavigate();

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form fields
    if (!formData.email) {
      setError("Email is required");
      document.querySelector('input[name="email"]')?.focus();
      return;
    }
    
    if (!formData.password) {
      setError("Password is required");
      document.querySelector('input[name="password"]')?.focus();
      return;
    }
    
    setError("");
    setIsLoading(true);
    
    try {
      // Use the login API function from chat.js
      await login(formData.email, formData.password);
      
      // On successful login
      if (formData.rememberMe) {
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberMe");
      }
      
      // Set login time for session tracking
      localStorage.setItem("login_time", Date.now().toString());
      
      // Redirect to chat page with a small delay
      setTimeout(() => {
        navigate("/chat");
      }, 500);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || "Login failed. Please check your credentials.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: { xs: 3, md: 2 },
        width: "100%",
      }}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <AppTextfield
        label="Email"
        name="email"
        placeholder="e.g Adam@gmail.com"
        type="email"
        icon={EmailIcon}
        value={formData.email}
        onChange={handleChange}
        required
      />
      <AppTextfield
        label="Password"
        name="password"
        placeholder="Password"
        type={showPassword ? "text" : "password"}
        icon={PasswordIcon}
        value={formData.password}
        onChange={handleChange}
        required
        endAdornment={
          showPassword ? (
            <VisibilityOffIcon
              onClick={handleClickShowPassword}
              style={{ cursor: "pointer", color: theme.palette.primary.main }}
            />
          ) : (
            <VisibilityIcon
              onClick={handleClickShowPassword}
              style={{ cursor: "pointer", color: theme.palette.primary.main }}
            />
          )
        }
      />
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        <Box sx={{ 
          display: "flex",
          alignItems: "center",
        }}>
          <Checkbox 
            size="small"
            sx={{
              padding: '4px',
            }}
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleChange}
          />
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.primary,
              whiteSpace: 'nowrap',
            }}
          >
            Remember me
          </Typography>
        </Box>
      </Box>
      <AppButton 
        type="submit"
        sx={{
          mt: { xs: 2, sm: 3 },
        }}
        disabled={isLoading}
      >
        {isLoading ? "Signing In..." : "Sign In"}
      </AppButton>
      <Typography
        variant="body2"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.5,
          flexWrap: "wrap",
          mt: { xs: 1, sm: 2 },
          color: theme.palette.text.primary,
          textAlign: "center",
        }}
      >
        Don't have an account?{" "}
        <Typography
          component="span"
          sx={{
            color: theme.palette.primary.main,
            fontWeight: "bold",
            cursor: "pointer",
            '&:hover': {
              textDecoration: 'underline',
            },
          }}
          onClick={() => navigate("/signup")}
        >
          Sign Up
        </Typography>
      </Typography>
    </Box>
  );
}
