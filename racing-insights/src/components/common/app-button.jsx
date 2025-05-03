import React from "react";
import { Button } from "@mui/material";

export default function AppButton({
  children,
  variant = "contained",
  fullWidth = true,
  ...props
}) {
  return (
    <Button
      variant={variant}
      fullWidth={fullWidth}
      sx={{
        height: 45,
        borderRadius: 2.5,
        backgroundColor: "primary.main",
        color: "#000000",
        mt: 1,
        textTransform: "none", // Ensure text is not transformed
        border: "none",
        boxShadow: "none",
        "&:hover": {
          backgroundColor: "primary.main",
          opacity: 0.9,
        },
        "& .MuiButton-root": {
          border: "none",
          textTransform: "none", // Add here as well to ensure it's not overridden
        },
        ...props.sx // Make sure we merge any custom styles passed in
      }}
      {...props}
    >
      {children}
    </Button>
  );
}
