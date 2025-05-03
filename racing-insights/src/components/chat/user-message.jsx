import React from "react";
import { Box, Paper, Avatar, Typography, useTheme } from "@mui/material";
import dummyuserprofile from "../../assets/images/dummyUserProfile.jpg";

export default function UserMessage({ message, time, user }) {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        width: "100%",
        mb: 2,
        position: "relative",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2,
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(239, 189, 147, 0.15)' 
            : theme.palette.primary.light,
          borderRadius: "12px 12px 0px 12px",
          boxShadow: "none",
          color: theme.palette.mode === 'dark' ? 'text.primary' : 'text.primary',
          maxWidth: "70%",
          border: theme.palette.mode === 'dark' ? '1px solid rgba(239, 189, 147, 0.2)' : 'none',
        }}
      >
        <Box sx={{ position: "relative" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 1,
            }}
          >
            <Avatar
              src={dummyuserprofile}
              alt="User"
              sx={{ width: 24, height: 24, borderRadius: "50%" }}
            />
            <Typography
              sx={{
                fontSize: "14px",
                fontWeight: 600,
                color: theme.palette.mode === 'dark' ? theme.palette.primary.main : theme.palette.primary.dark,
              }}
            >
              {user}
            </Typography>
            <Typography
              sx={{
                fontSize: "12px",
                color: "text.secondary",
                ml: 'auto'
              }}
            >
              {time}
            </Typography>
          </Box>
          
          <Typography 
            sx={{ 
              wordBreak: "break-word", 
              whiteSpace: "pre-wrap", 
              overflowWrap: "break-word",
              fontSize: "14px",
              lineHeight: 1.6,
            }}
          >
            {message}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}