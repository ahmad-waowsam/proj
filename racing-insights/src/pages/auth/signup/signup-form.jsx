import { React, useState } from "react";
import { Box, Typography, Checkbox, Alert } from "@mui/material";
import * as yup from "yup";
import { useFormik } from "formik";
import AppTextfield from "../../../components/common/app-textfield";
import UserIcon from "../../../assets/icons/user.svg";
import PasswordIcon from "../../../assets/icons/password-rounded.svg";
import EmailIcon from "../../../assets/icons/baseline-email.svg";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import AppButton from "../../../components/common/app-button";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { signup } from "../../../api/chat";

export default function SignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const theme = useTheme();
  const navigate = useNavigate();

  const validationSchema = yup.object({
    username: yup
      .string()
      .required("Username is required"),
    email: yup
      .string()
      .email("Enter a valid email")
      .required("Email is required"),
    password: yup
      .string()
      .min(8, "Password should be of minimum 8 characters length")
      .required("Password is required"),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref("password"), null], "Passwords must match")
      .required("Confirm password is required"),
    termsAccepted: yup
      .boolean()
      .oneOf([true], "You must accept the terms and conditions")
  });
  
  const formik = useFormik({
    initialValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      termsAccepted: false
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      console.log("Form submitted with values:", values);
      setIsLoading(true);
      setError("");
      
      try {
        // Prepare data object with exactly the fields the API expects
        const userData = {
          email: values.email,
          username: values.username,
          password: values.password
        };
        
        console.log("Sending signup request with data:", userData);
        
        // Call the signup API with form values
        const response = await signup(userData);
        console.log("Signup successful, response:", response);
        
        // Show success message and store email for login
        setSuccess(true);
        localStorage.setItem('user_email', values.email);
        
        // On successful signup, navigate to signin page with a small delay
        setTimeout(() => {
          navigate("/signin");
        }, 1500);
      } catch (err) {
        console.error("Signup error:", err);
        
        // Get detailed error message from response if available
        let errorMessage = "Signup failed. Please try again.";
        if (err.response) {
          if (err.response.data && err.response.data.detail) {
            errorMessage = err.response.data.detail;
          } else if (err.response.status === 400) {
            errorMessage = "Email may already be registered or invalid data provided.";
          } else if (err.response.status === 500) {
            errorMessage = "Server error. Please try again later.";
          }
          console.log("Error response:", err.response);
        } else if (err.request) {
          errorMessage = "No response from server. Please check your connection.";
          console.log("Error request:", err.request);
        } else {
          console.log("Error message:", err.message);
        }
        
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }
  });

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };
  
  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
  
  // Improved submit handler with validation feedback
  const handleSubmitClick = (e) => {
    // Prevent default button behavior 
    if (e) e.preventDefault();
    
    // Manually trigger validation
    formik.validateForm().then(errors => {
      if (Object.keys(errors).length === 0) {
        // Explicitly call the onSubmit function with current values if validation passes
        formik.submitForm();
      } else {
        // Touch all fields to show validation errors
        Object.keys(formik.values).forEach(field => {
          formik.setFieldTouched(field, true, true);
        });
        
        // If password error is present, focus on password field
        if (errors.password) {
          document.querySelector('input[name="password"]')?.focus();
        } else {
          // Focus on the first field with an error
          const firstErrorField = Object.keys(errors)[0];
          document.querySelector(`input[name="${firstErrorField}"]`)?.focus();
        }
      }
    });
  };

  return (
    <Box
      component="form"
      onSubmit={formik.handleSubmit}
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
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Account created successfully! Redirecting to login...
        </Alert>
      )}
      
      <AppTextfield
        label="Username"
        name="username"
        placeholder="e.g AdamSmith"
        type="text"
        icon={UserIcon}
        value={formik.values.username}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.username && Boolean(formik.errors.username)}
        helperText={formik.touched.username && formik.errors.username}
      />
      <AppTextfield
        label="Email"
        name="email"
        placeholder="e.g Adam@gmail.com"
        type="email"
        icon={EmailIcon}
        value={formik.values.email}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.email && Boolean(formik.errors.email)}
        helperText={formik.touched.email && formik.errors.email}
      />
      <AppTextfield
        label="Password"
        name="password"
        placeholder="Password Here"
        type={showPassword ? "text" : "password"}
        icon={PasswordIcon}
        value={formik.values.password}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.password && Boolean(formik.errors.password)}
        helperText={formik.touched.password && formik.errors.password}
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
      <AppTextfield
        label="Confirm Password"
        name="confirmPassword"
        placeholder="Password Here"
        type={showConfirmPassword ? "text" : "password"}
        icon={PasswordIcon}
        value={formik.values.confirmPassword}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
        helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
        endAdornment={
          showConfirmPassword ? (
            <VisibilityOffIcon
              onClick={handleClickShowConfirmPassword}
              style={{ cursor: "pointer", color: theme.palette.primary.main }}
            />
          ) : (
            <VisibilityIcon
              onClick={handleClickShowConfirmPassword}
              style={{ cursor: "pointer", color: theme.palette.primary.main }}
            />
          )
        }
      />
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 0.5,
        }}
      >
        <Checkbox 
          size="small"
          sx={{
            padding: '4px',
            mt: '-4px',
          }}
          name="termsAccepted"
          checked={formik.values.termsAccepted}
          onChange={formik.handleChange}
        />
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.primary,
            '& span': {
              color: theme.palette.primary.main,
              fontWeight: "bold",
              cursor: "pointer",
              ml: 0.5,
              '&:hover': {
                textDecoration: 'underline',
              },
            }
          }}
        >
          I accept the
          <span>Terms and Conditions</span>
        </Typography>
      </Box>
      {formik.touched.termsAccepted && formik.errors.termsAccepted && (
        <Typography color="error" variant="caption">
          {formik.errors.termsAccepted}
        </Typography>
      )}
      <AppButton 
        type="submit"
        sx={{
          mt: { xs: 2, sm: 3 },
        }}
        disabled={isLoading}
        onClick={handleSubmitClick}
      >
        {isLoading ? "Signing Up..." : "Sign Up"}
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
        Already have an account?{" "}
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
          onClick={() => navigate("/signin")}
        >
          Sign In
        </Typography>
      </Typography>
    </Box>
  );
}
