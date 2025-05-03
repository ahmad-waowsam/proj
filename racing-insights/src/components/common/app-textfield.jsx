import React from "react";
import { TextField, InputAdornment, useTheme } from "@mui/material";

export default function AppTextfield({
  label,
  name,
  placeholder,
  type = "text",
  value,
  onChange,
  onBlur,
  error,
  icon,
  endAdornment,
}) {
  const theme = useTheme();

  return (
    <TextField
      fullWidth
      label={label}
      name={name}
      placeholder={placeholder}
      type={type}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      error={!!error}
      helperText={error}
      InputLabelProps={{
        shrink: true,
        sx: {
          position: "relative",
          transform: "none",
          marginBottom: 1,
          mt: 1,
        },
      }}
      sx={{
        "& .MuiOutlinedInput-root": {
          backgroundColor: theme.palette.secondary.main,
          borderRadius: 2.5,
          "& fieldset": {
            border: "none",
          },
        },
        "& .MuiFormLabel-root": {
          position: "relative",
          fontWeight: "500",
          color: theme.palette.text.primary,
        },
      }}
      InputProps={{
        startAdornment: icon ? (
          <InputAdornment position="start">
            <img
              src={icon}
              alt={label}
              style={{
                width: 20,
                height: 20,
                filter:
                  theme.palette.mode === "dark"
                    ? "brightness(10)"
                    : "brightness(0)",
              }}
            />
          </InputAdornment>
        ) : null,
        endAdornment: endAdornment ? (
          <InputAdornment
            position="end"
            sx={{
              "& svg": {
                color: theme.palette.text.primary,
                fontSize: 20,
              },
            }}
          >
            {endAdornment}
          </InputAdornment>
        ) : null,
      }}
    />
  );
}
